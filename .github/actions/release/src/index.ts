import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { parse as parseYaml } from 'yaml';

const SUPPORTED_EXECUTORS = ['npm', 'pnpm', 'yarn', 'bun', 'node'] as const;
const SUPPORTED_PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const;
const SCRIPT_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:._-]*$/;

type Executor = (typeof SUPPORTED_EXECUTORS)[number];
type PackageManager = (typeof SUPPORTED_PACKAGE_MANAGERS)[number];
type JsonObject = Record<string, unknown>;

interface ReleaseConfig {
  projectPath: string;
  relativeProjectPath: string;
  executor: Executor;
  packageManager: PackageManager;
  useMise: boolean;
  changesetsCli: string;
  updateLockfile: boolean;
  versionAfter: string[];
  publishBefore: string[];
  createGithubReleases: boolean;
  pushGitTags: boolean;
  pullRequestTitle: string;
  commitMessage: string;
  pullRequestBaseBranch: string;
  pullRequestDraft: string;
}

class CommandError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Rejects unknown keys so configuration mistakes cannot be ignored silently. */
function assertKnownKeys(value: JsonObject, allowed: string[], label: string): void {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new Error(`${label} contains unknown key ${JSON.stringify(unknown[0])}.`);
  }
}

/** Narrows one configuration section to a plain object. */
function optionalObject(value: unknown, label: string): JsonObject {
  if (value === undefined) return {};
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as JsonObject;
}

/** Reads an optional string while rejecting output-injection newlines. */
function optionalString(value: unknown, fallback: string, label: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || value.includes('\n') || value.includes('\r')) {
    throw new Error(`${label} must be a single-line string.`);
  }
  return value;
}

/** Reads an optional strict boolean. */
function optionalBoolean(value: unknown, fallback: boolean, label: string): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') {
    throw new Error(`${label} must be true or false.`);
  }
  return value;
}

/** Reads package-script names and rejects command strings. */
function optionalScripts(value: unknown, label: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array of package script names.`);
  }

  return value.map((entry, index) => {
    if (typeof entry !== 'string' || !SCRIPT_NAME_PATTERN.test(entry)) {
      throw new Error(`${label}[${index}] is not a valid package script name.`);
    }
    return entry;
  });
}

/** Parses a JSON or YAML configuration file. */
function readConfigFile(configPath: string): JsonObject {
  let parsed: unknown;
  const source = readFileSync(configPath, 'utf8');

  try {
    parsed = path.extname(configPath).toLowerCase() === '.json' ? JSON.parse(source) : parseYaml(source);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot parse release configuration ${configPath}: ${message}`);
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Release configuration ${configPath} must contain an object.`);
  }
  return parsed as JsonObject;
}

/** Returns true when a canonical path stays inside the checked-out workspace. */
function isInsideWorkspace(workspace: string, candidate: string): boolean {
  const relative = path.relative(workspace, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/** Resolves a repository-owned path without allowing workspace traversal. */
function resolveInsideWorkspace(workspace: string, candidate: string, label: string): string {
  const resolved = realpathSync(path.resolve(workspace, candidate));
  if (!isInsideWorkspace(workspace, resolved)) {
    throw new Error(`${label} must resolve inside ${workspace}.`);
  }
  return resolved;
}

/** Infers the package manager from packageManager or one unambiguous lockfile. */
function inferPackageManager(projectPath: string, packageJson: JsonObject): PackageManager {
  if (typeof packageJson.packageManager === 'string') {
    const name = packageJson.packageManager.split('@')[0];
    if (SUPPORTED_PACKAGE_MANAGERS.includes(name as PackageManager)) {
      return name as PackageManager;
    }
    throw new Error(`Unsupported package manager ${JSON.stringify(name)} in package.json.`);
  }

  const lockfiles: Array<[PackageManager, string[]]> = [
    ['npm', ['package-lock.json', 'npm-shrinkwrap.json']],
    ['pnpm', ['pnpm-lock.yaml']],
    ['yarn', ['yarn.lock']],
    ['bun', ['bun.lock', 'bun.lockb']],
  ];
  const matches = lockfiles
    .filter(([, files]) => files.some((file) => existsSync(path.join(projectPath, file))))
    .map(([manager]) => manager);

  if (matches.length > 1) {
    throw new Error(`Package manager is ambiguous: found lockfiles for ${matches.join(', ')}.`);
  }
  return matches[0] ?? 'npm';
}

/** Resolves and validates the project-installed Changesets CLI. */
function resolveChangesetsCli(projectPath: string, workspace: string, packageManager: PackageManager): string {
  let searchPath = projectPath;
  let packageFile = '';
  while (isInsideWorkspace(workspace, searchPath)) {
    const candidate = path.join(searchPath, 'node_modules', '@changesets', 'cli', 'package.json');
    if (existsSync(candidate)) {
      packageFile = realpathSync(candidate);
      break;
    }
    if (searchPath === workspace) break;
    searchPath = path.dirname(searchPath);
  }
  if (!packageFile) {
    if (
      packageManager === 'yarn' &&
      (existsSync(path.join(projectPath, '.pnp.cjs')) || existsSync(path.join(projectPath, '.pnp.loader.mjs')))
    ) {
      throw new Error(
        "Yarn Plug'n'Play is not supported. Configure nodeLinker: node-modules before installing dependencies.",
      );
    }
    throw new Error('Install @changesets/cli version 3 in the target project before running the action.');
  }

  const cliPackage = JSON.parse(readFileSync(packageFile, 'utf8')) as JsonObject;
  const version = String(cliPackage.version ?? '');
  if (!version.startsWith('3.')) {
    throw new Error(`@changesets/cli version 3 is required; found ${version || 'an unknown version'}.`);
  }

  const bin = cliPackage.bin;
  const binPath =
    typeof bin === 'string'
      ? bin
      : bin !== null && typeof bin === 'object' && !Array.isArray(bin)
        ? String((bin as JsonObject).changeset ?? '')
        : '';
  if (!binPath) {
    throw new Error('The installed @changesets/cli package does not declare the changeset binary.');
  }
  return path.resolve(path.dirname(packageFile), binPath);
}

/** Rejects an incomplete GitHub App credential pair before mode selection. */
function validateGitHubAuthentication(): void {
  const clientIdSet = process.env.TEMPEL_RELEASE_GITHUB_APP_CLIENT_ID_SET === 'true';
  const privateKeySet = process.env.TEMPEL_RELEASE_GITHUB_APP_PRIVATE_KEY_SET === 'true';
  if (clientIdSet !== privateKeySet) {
    throw new Error('github-app-client-id and github-app-private-key must be supplied together.');
  }
}

/** Loads, validates, and normalizes the release configuration. */
function loadConfig(configArgument?: string): ReleaseConfig {
  const workspace = realpathSync(process.env.TEMPEL_RELEASE_WORKSPACE ?? process.env.GITHUB_WORKSPACE ?? process.cwd());
  const rawConfigPath = configArgument ?? process.env.TEMPEL_RELEASE_CONFIG ?? '';
  let configPath: string | undefined;
  let raw: JsonObject = {};

  if (rawConfigPath) {
    const unresolved = path.resolve(workspace, rawConfigPath);
    if (!existsSync(unresolved)) {
      throw new Error(`Release configuration ${unresolved} does not exist.`);
    }
    configPath = resolveInsideWorkspace(workspace, rawConfigPath, 'Configuration path');
    const extension = path.extname(configPath).toLowerCase();
    if (!['.json', '.yaml', '.yml'].includes(extension)) {
      throw new Error('Release configuration must use a .json, .yaml, or .yml extension.');
    }
    raw = readConfigFile(configPath);
  }

  assertKnownKeys(raw, ['version', 'engine', 'project', 'versioning', 'publishing', 'pull_request'], 'Configuration');
  if (configPath && raw.version !== 1) {
    throw new Error('Configuration version must be 1.');
  }
  if (configPath && raw.engine !== 'changesets') {
    throw new Error('Configuration engine must be changesets.');
  }

  const project = optionalObject(raw.project, 'project');
  const versioning = optionalObject(raw.versioning, 'versioning');
  const publishing = optionalObject(raw.publishing, 'publishing');
  const pullRequest = optionalObject(raw.pull_request, 'pull_request');
  assertKnownKeys(project, ['path', 'executor', 'package_manager', 'use_mise'], 'project');
  assertKnownKeys(versioning, ['update_lockfile', 'after'], 'versioning');
  assertKnownKeys(publishing, ['before', 'create_github_releases', 'push_git_tags'], 'publishing');
  assertKnownKeys(pullRequest, ['title', 'commit_message', 'base_branch', 'draft'], 'pull_request');

  const projectSetting = optionalString(project.path, '.', 'project.path');
  if (!projectSetting) throw new Error('project.path must not be empty.');
  const projectPath = resolveInsideWorkspace(workspace, projectSetting, 'project.path');
  const packageFile = path.join(projectPath, 'package.json');
  if (!existsSync(packageFile)) {
    throw new Error(`project.path does not contain package.json: ${projectPath}`);
  }
  if (!existsSync(path.join(projectPath, '.changeset', 'config.json'))) {
    throw new Error(`project.path does not contain .changeset/config.json: ${projectPath}`);
  }

  const packageJson = JSON.parse(readFileSync(packageFile, 'utf8')) as JsonObject;
  const inferredManager = inferPackageManager(projectPath, packageJson);
  const packageManager = optionalString(project.package_manager, inferredManager, 'project.package_manager');
  if (!SUPPORTED_PACKAGE_MANAGERS.includes(packageManager as PackageManager)) {
    throw new Error(`project.package_manager must be one of ${SUPPORTED_PACKAGE_MANAGERS.join(', ')}.`);
  }

  const executor = optionalString(project.executor, packageManager, 'project.executor');
  if (!SUPPORTED_EXECUTORS.includes(executor as Executor)) {
    throw new Error(`project.executor must be one of ${SUPPORTED_EXECUTORS.join(', ')}.`);
  }

  const updateLockfile = optionalBoolean(versioning.update_lockfile, true, 'versioning.update_lockfile');
  if (updateLockfile && packageManager !== 'npm' && packageManager !== 'pnpm') {
    throw new Error(
      'Automatic lockfile updates currently support npm and pnpm only. Set versioning.update_lockfile to false.',
    );
  }

  const createGithubReleases = optionalBoolean(
    publishing.create_github_releases,
    true,
    'publishing.create_github_releases',
  );
  const pushGitTags = optionalBoolean(publishing.push_git_tags, true, 'publishing.push_git_tags');
  if (createGithubReleases && !pushGitTags) {
    throw new Error('publishing.push_git_tags cannot be false when create_github_releases is true.');
  }

  const draft = optionalString(pullRequest.draft, '', 'pull_request.draft');
  if (draft && draft !== 'create' && draft !== 'always') {
    throw new Error('pull_request.draft must be create or always.');
  }

  const versionAfter = optionalScripts(versioning.after, 'versioning.after');
  const publishBefore = optionalScripts(publishing.before, 'publishing.before');
  const scripts = optionalObject(packageJson.scripts, 'package.json scripts');
  for (const script of [...versionAfter, ...publishBefore]) {
    if (typeof scripts[script] !== 'string') {
      throw new Error(`Configured package script ${JSON.stringify(script)} does not exist in ${packageFile}.`);
    }
  }

  return {
    projectPath,
    relativeProjectPath: path.relative(workspace, projectPath) || '.',
    executor: executor as Executor,
    packageManager: packageManager as PackageManager,
    useMise: optionalBoolean(project.use_mise, false, 'project.use_mise'),
    changesetsCli: resolveChangesetsCli(projectPath, workspace, packageManager as PackageManager),
    updateLockfile,
    versionAfter,
    publishBefore,
    createGithubReleases,
    pushGitTags,
    pullRequestTitle: optionalString(pullRequest.title, 'Version Packages', 'pull_request.title'),
    commitMessage: optionalString(pullRequest.commit_message, 'Version Packages', 'pull_request.commit_message'),
    pullRequestBaseBranch: optionalString(pullRequest.base_branch, '', 'pull_request.base_branch'),
    pullRequestDraft: draft,
  };
}

/** Wraps one command with mise when the configuration requests it. */
function withMise(config: ReleaseConfig, command: string, args: string[]): [string, string[]] {
  return config.useMise ? ['mise', ['exec', '--', command, ...args]] : [command, args];
}

/** Runs one command without a shell and preserves its exit status. */
function runCommand(config: ReleaseConfig, command: string, args: string[], label: string): void {
  const [resolvedCommand, resolvedArgs] = withMise(config, command, args);
  process.stdout.write(`Running ${label}: ${[resolvedCommand, ...resolvedArgs].join(' ')}\n`);
  const result = spawnSync(resolvedCommand, resolvedArgs, {
    cwd: config.projectPath,
    env: process.env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new CommandError(`${label} failed with exit code ${result.status ?? 1}.`, result.status ?? 1);
  }
}

/** Runs one configured package script through its selected executor. */
function runPackageScript(config: ReleaseConfig, script: string): void {
  const args = config.executor === 'node' ? ['--run', script] : ['run', script];
  runCommand(config, config.executor, args, `package script ${script}`);
}

/** Runs the project-installed Changesets CLI without package-manager exec differences. */
function runChangesets(config: ReleaseConfig, operation: 'version' | 'publish'): void {
  const nodeCommand = config.useMise ? 'node' : process.execPath;
  runCommand(config, nodeCommand, [config.changesetsCli, operation], `changesets ${operation}`);
}

/** Updates the lockfile after Changesets modifies package manifests. */
function updateLockfile(config: ReleaseConfig): void {
  if (!config.updateLockfile) return;
  if (config.packageManager === 'npm') {
    runCommand(config, 'npm', ['install', '--package-lock-only', '--ignore-scripts'], 'npm lockfile update');
    return;
  }
  if (config.packageManager === 'pnpm') {
    runCommand(
      config,
      'pnpm',
      ['install', '--lockfile-only', '--no-frozen-lockfile', '--ignore-scripts'],
      'pnpm lockfile update',
    );
    return;
  }
  throw new Error(`No lockfile updater is available for ${config.packageManager}.`);
}

/** Writes normalized scalar values for later composite-action steps. */
function writeActionOutputs(config: ReleaseConfig): void {
  const output = process.env.GITHUB_OUTPUT;
  const values: Record<string, string> = {
    cwd: config.relativeProjectPath,
    'commit-message': config.commitMessage,
    'pr-title': config.pullRequestTitle,
    'pr-base-branch': config.pullRequestBaseBranch,
    'pr-draft': config.pullRequestDraft,
    'create-github-releases': String(config.createGithubReleases),
    'push-git-tags': String(config.pushGitTags),
    'use-github-app': String(process.env.TEMPEL_RELEASE_GITHUB_APP_CLIENT_ID_SET === 'true'),
  };

  if (!output) {
    process.stdout.write(`${JSON.stringify(values, null, 2)}\n`);
    return;
  }
  for (const [name, value] of Object.entries(values)) {
    if (value.includes('\n') || value.includes('\r')) {
      throw new Error(`Action output ${name} must fit on one line.`);
    }
    appendFileSync(output, `${name}=${value}\n`);
  }
}

/** Removes Markdown control characters and bounds one summary value. */
function summaryValue(value: string): string {
  return value.replace(/[\r\n|]/g, ' ').slice(0, 120);
}

/** Appends a bounded release result to the GitHub job summary. */
function writeSummary(): void {
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (!summary) return;

  const mode = process.env.TEMPEL_RELEASE_MODE || 'unknown';
  const prNumber = process.env.TEMPEL_RELEASE_PR_NUMBER || '';
  const published = process.env.TEMPEL_RELEASE_PUBLISHED || 'false';
  let packages: Array<{ name: string; version: string }> = [];
  try {
    const parsed = JSON.parse(process.env.TEMPEL_RELEASE_PUBLISHED_PACKAGES || '[]') as unknown;
    if (Array.isArray(parsed)) {
      packages = parsed
        .filter((entry): entry is { name: string; version: string } => {
          return (
            entry !== null &&
            typeof entry === 'object' &&
            typeof (entry as { name?: unknown }).name === 'string' &&
            typeof (entry as { version?: unknown }).version === 'string'
          );
        })
        .slice(0, 25);
    }
  } catch {
    packages = [];
  }

  const lines = [
    '## Release',
    '',
    '| Field | Result |',
    '| --- | --- |',
    `| Mode | ${summaryValue(mode)} |`,
    `| Version pull request | ${summaryValue(prNumber) || 'Not created'} |`,
    `| Published | ${summaryValue(published)} |`,
  ];
  if (packages.length > 0) {
    lines.push('', '| Package | Version |', '| --- | --- |');
    for (const item of packages) {
      lines.push(`| ${summaryValue(item.name)} | ${summaryValue(item.version)} |`);
    }
  }
  try {
    appendFileSync(summary, `${lines.join('\n')}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Release action: unable to write job summary: ${message}\n`);
  }
}

/** Returns a CLI option value without evaluating shell text. */
function readOption(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  if (!value) throw new Error(`${name} requires a value.`);
  return value;
}

/** Runs the requested local or GitHub Action operation. */
function main(): void {
  const operation = process.argv[2];
  if (operation === 'summary') {
    writeSummary();
    return;
  }

  validateGitHubAuthentication();
  const config = loadConfig(readOption('--config'));
  if (operation === 'resolve') {
    writeActionOutputs(config);
    return;
  }
  if (operation === 'version') {
    runChangesets(config, 'version');
    updateLockfile(config);
    for (const script of config.versionAfter) runPackageScript(config, script);
    return;
  }
  if (operation === 'publish') {
    if (!process.env.NODE_AUTH_TOKEN) {
      throw new Error('Publish mode requires NODE_AUTH_TOKEN.');
    }
    for (const script of config.publishBefore) runPackageScript(config, script);
    runChangesets(config, 'publish');
    return;
  }
  throw new Error('Usage: release <resolve|version|publish|summary> [--config <path>]');
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Release action: ${message}\n`);
  process.exitCode = error instanceof CommandError ? error.status : 1;
}

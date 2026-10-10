export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export const PACKAGE_MANAGERS: readonly PackageManager[] = ["npm", "pnpm", "yarn", "bun"];

const INSTALL_VERBS = new Set(["install", "i", "add"]);
const REMOVE_VERBS = new Set(["uninstall", "remove", "rm", "un"]);
const DEV_FLAGS = new Set(["-D", "--save-dev", "--dev"]);
const GLOBAL_FLAGS = new Set(["-g", "--global"]);
const DROPPED_FLAGS = new Set(["-S", "--save"]);

function splitArgs(args: string[]): { dev: boolean; global: boolean; flags: string[]; packages: string[] } {
  let dev = false;
  let global = false;
  const flags: string[] = [];
  const packages: string[] = [];
  for (const arg of args) {
    if (DEV_FLAGS.has(arg)) dev = true;
    else if (GLOBAL_FLAGS.has(arg)) global = true;
    else if (DROPPED_FLAGS.has(arg)) continue;
    else if (arg === "--save-exact") flags.push("-E");
    else if (arg.startsWith("-")) flags.push(arg);
    else packages.push(arg);
  }
  return { dev, global, flags, packages };
}

function join(parts: string[]): string {
  return parts.filter((part) => part.length > 0).join(" ");
}

function convertInstall(args: string[], pm: PackageManager): string {
  const { dev, global, flags, packages } = splitArgs(args);
  const rest = join([...flags, ...packages]);

  if (packages.length === 0) {
    switch (pm) {
      case "npm":
        return join(["npm install", rest]);
      case "pnpm":
        return join(["pnpm install", rest]);
      case "yarn":
        return join(["yarn", rest]);
      case "bun":
        return join(["bun install", rest]);
    }
  }

  const devFlag = dev ? "-D" : "";
  switch (pm) {
    case "npm":
      return join(["npm install", global ? "-g" : "", devFlag, rest]);
    case "pnpm":
      return join(["pnpm add", global ? "-g" : "", devFlag, rest]);
    case "yarn":
      return join([global ? "yarn global add" : "yarn add", devFlag, rest]);
    case "bun":
      return join(["bun add", global ? "-g" : "", devFlag, rest]);
  }
}

function convertRemove(args: string[], pm: PackageManager): string {
  const { global, flags, packages } = splitArgs(args);
  const rest = join([...flags, ...packages]);
  switch (pm) {
    case "npm":
      return join(["npm uninstall", global ? "-g" : "", rest]);
    case "pnpm":
      return join(["pnpm remove", global ? "-g" : "", rest]);
    case "yarn":
      return join([global ? "yarn global remove" : "yarn remove", rest]);
    case "bun":
      return join(["bun remove", global ? "-g" : "", rest]);
  }
}

function convertExec(args: string[], pm: PackageManager): string {
  const rest = join(args[0] === "--" ? args.slice(1) : args);
  switch (pm) {
    case "npm":
      return join(["npx", rest]);
    case "pnpm":
      return join(["pnpm dlx", rest]);
    case "yarn":
      return join(["yarn dlx", rest]);
    case "bun":
      return join(["bunx", rest]);
  }
}

function convertSubcommand(verb: "run" | "create", args: string[], pm: PackageManager): string {
  return join([`${pm} ${verb}`, ...args]);
}

/**
 * Rewrites a single npm command line for another package manager. Lines that
 * do not start with `npm` or `npx`, and npm subcommands without a known
 * equivalent, are returned unchanged.
 */
export function convertCommand(line: string, pm: PackageManager): string {
  const trimmed = line.trim();
  const tokens = trimmed.split(/\s+/);
  const [bin, verb, ...args] = tokens;
  if (bin === "npx") return convertExec(tokens.slice(1), pm);
  if (bin !== "npm" || !verb) return line;

  if (INSTALL_VERBS.has(verb)) return convertInstall(args, pm);
  if (REMOVE_VERBS.has(verb)) return convertRemove(args, pm);
  if (verb === "exec") return convertExec(args, pm);
  if (verb === "run") return convertSubcommand("run", args, pm);
  if (verb === "create" || verb === "init") return convertSubcommand("create", args, pm);
  return line;
}

/** Converts every line of a `package-install` fence body, keeping blank lines. */
export function convertCommands(body: string, pm: PackageManager): string {
  return body
    .split("\n")
    .map((line) => (line.trim().length === 0 ? "" : convertCommand(line, pm)))
    .join("\n");
}

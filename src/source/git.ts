import { execFile } from "node:child_process";
import path from "node:path";

interface GitCacheEntry {
  mtimeMs: number;
  date: Date | undefined;
}

const cache = new Map<string, GitCacheEntry>();

function runGit(args: string[], cwd: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    execFile("git", args, { cwd, timeout: 5000, windowsHide: true }, (error, stdout) => {
      resolve(error ? undefined : stdout.trim());
    });
  });
}

/**
 * Commit time of the last change to `file`, or undefined when git is missing,
 * the file is untracked, or the history does not contain it (shallow clones).
 * Results are cached per path and mtime so each file is queried at most once
 * per edit.
 */
export async function getGitLastModified(file: string, mtimeMs: number): Promise<Date | undefined> {
  const cached = cache.get(file);
  if (cached && cached.mtimeMs === mtimeMs) return cached.date;

  const output = await runGit(["log", "-1", "--format=%ct", "--", path.basename(file)], path.dirname(file));
  const seconds = output ? Number.parseInt(output, 10) : Number.NaN;
  const date = Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000) : undefined;
  cache.set(file, { mtimeMs, date });
  return date;
}

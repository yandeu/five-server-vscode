import { isAbsolute, relative, sep } from "path";

export interface WorkspaceFolderInfo {
  name: string;
  fsPath: string;
}

export type FolderResolution = { kind: "folder"; folder: WorkspaceFolderInfo } | { kind: "pick" } | { kind: "none" };

// true when filePath is the folder itself or lies below it
export function isPathInside(folderPath: string, filePath: string): boolean {
  const rel = relative(folderPath, filePath);
  if (rel === "") return true;
  if (isAbsolute(rel)) return false;
  return rel !== ".." && !rel.startsWith(".." + sep);
}

/**
 * Pick the folder to serve.
 * - No folders: none.
 * - A file inside one or more folders: the deepest containing folder.
 * - Otherwise a single folder: that folder.
 * - Otherwise (several folders, no containing folder): the user has to pick one.
 */
export function resolveWorkspaceFolder(folders: WorkspaceFolderInfo[], filePath: string | undefined): FolderResolution {
  if (folders.length === 0) return { kind: "none" };

  if (filePath) {
    let match: WorkspaceFolderInfo | undefined;
    for (const folder of folders) {
      if (!isPathInside(folder.fsPath, filePath)) continue;
      if (!match || folder.fsPath.length > match.fsPath.length) match = folder;
    }
    if (match) return { kind: "folder", folder: match };
  }

  if (folders.length === 1) return { kind: "folder", folder: folders[0] };

  return { kind: "pick" };
}

// path of absolutePath relative to folderPath, with forward slashes and no leading slash
export function relativeFolderPath(folderPath: string, absolutePath: string): string {
  return relative(folderPath, absolutePath).split(sep).join("/");
}

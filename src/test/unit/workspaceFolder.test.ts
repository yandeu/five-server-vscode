import * as assert from "assert";
import { isPathInside, relativeFolderPath, resolveWorkspaceFolder, WorkspaceFolderInfo } from "../../workspaceFolder";

function folder(name: string, fsPath: string): WorkspaceFolderInfo {
  return { name, fsPath };
}

describe("resolveWorkspaceFolder", () => {
  it("returns none when there are no folders", () => {
    const result = resolveWorkspaceFolder([], "/ws/app/index.html");
    assert.deepStrictEqual(result, { kind: "none" });
  });

  it("returns the only folder when no file is given", () => {
    const app = folder("app", "/ws/app");
    const result = resolveWorkspaceFolder([app], undefined);
    assert.deepStrictEqual(result, { kind: "folder", folder: app });
  });

  it("returns the only folder when the file is inside it", () => {
    const app = folder("app", "/ws/app");
    const result = resolveWorkspaceFolder([app], "/ws/app/index.html");
    assert.deepStrictEqual(result, { kind: "folder", folder: app });
  });

  it("returns the only folder when the file is outside it (single-folder behaviour unchanged)", () => {
    const app = folder("app", "/ws/app");
    const result = resolveWorkspaceFolder([app], "/elsewhere/index.html");
    assert.deepStrictEqual(result, { kind: "folder", folder: app });
  });

  it("returns the second folder when the file is inside it", () => {
    const app = folder("app", "/ws/app");
    const other = folder("other", "/ws/other");
    const result = resolveWorkspaceFolder([app, other], "/ws/other/www/index.html");
    assert.deepStrictEqual(result, { kind: "folder", folder: other });
  });

  it("returns pick when the file is outside every folder", () => {
    const app = folder("app", "/ws/app");
    const other = folder("other", "/ws/other");
    const result = resolveWorkspaceFolder([app, other], "/elsewhere/index.html");
    assert.deepStrictEqual(result, { kind: "pick" });
  });

  it("returns pick when there are several folders and no file", () => {
    const app = folder("app", "/ws/app");
    const other = folder("other", "/ws/other");
    const result = resolveWorkspaceFolder([app, other], undefined);
    assert.deepStrictEqual(result, { kind: "pick" });
  });

  it("prefers the longest matching folder for nested folders", () => {
    const a = folder("a", "/ws/a");
    const ab = folder("ab", "/ws/a/b");
    const result = resolveWorkspaceFolder([a, ab], "/ws/a/b/c.html");
    assert.deepStrictEqual(result, { kind: "folder", folder: ab });
  });

  it("does not match a sibling folder that shares a name prefix", () => {
    const app = folder("app", "/ws/app");
    const app2 = folder("app-2", "/ws/app-2");
    const result = resolveWorkspaceFolder([app, app2], "/ws/app-2/x.html");
    assert.deepStrictEqual(result, { kind: "folder", folder: app2 });
  });

  it("returns pick for a file in a sibling with a shared prefix when that sibling is not a folder", () => {
    const app = folder("app", "/ws/app");
    const other = folder("other", "/ws/other");
    const result = resolveWorkspaceFolder([app, other], "/ws/app-2/x.html");
    assert.deepStrictEqual(result, { kind: "pick" });
  });
});

describe("isPathInside", () => {
  it("is true for the folder itself", () => {
    assert.strictEqual(isPathInside("/ws/app", "/ws/app"), true);
  });

  it("is true for a nested file", () => {
    assert.strictEqual(isPathInside("/ws/app", "/ws/app/www/index.html"), true);
  });

  it("is false for a sibling with a shared name prefix", () => {
    assert.strictEqual(isPathInside("/ws/app", "/ws/app-2/x"), false);
  });

  it("is false for a parent path", () => {
    assert.strictEqual(isPathInside("/ws/app", "/ws"), false);
  });
});

describe("relativeFolderPath", () => {
  it("returns the path of a file relative to the folder", () => {
    assert.strictEqual(relativeFolderPath("/ws/app", "/ws/app/www/index.html"), "www/index.html");
  });

  it("returns an empty string for the folder itself", () => {
    assert.strictEqual(relativeFolderPath("/ws/app", "/ws/app"), "");
  });

  it("uses forward slashes and has no leading slash", () => {
    assert.strictEqual(relativeFolderPath("/ws/app", "/ws/app/a/b.js"), "a/b.js");
  });
});

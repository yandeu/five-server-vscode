import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../../extension';

import fetch from "node-fetch";

const pause = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
};

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("open five-server", async () => {
    const res1 = await vscode.commands.executeCommand("fiveServer.open");
    assert.strictEqual(res1, "done");
    return pause(5000);
  });

  test("fetch index.html file", async () => {
    const res = await fetch("http://localhost:5555");
    const html = await res.text();

    const content = /hello from test file/gm.test(html);

    assert.strictEqual(content, true);

    return;
  });

  test("close five-server", async () => {
    const res2 = await vscode.commands.executeCommand("fiveServer.close");
    assert.strictEqual(res2, "done");
    return pause(5000);
  });
});

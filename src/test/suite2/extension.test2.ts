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

suite("Extension Test Suite 2", () => {
  test("init testing", async () => {
    vscode.window.showInformationMessage("Start all tests. Wait for onStartupFinished event.");
    return pause(5000);
  });

  test("open five-server", async () => {
    const res1 = await vscode.commands.executeCommand("fiveServer.open");
    assert.strictEqual(res1, "done");
    // return pause(5000);
  });

  test("opens file explorer", async () => {
    const res = await fetch("http://localhost:8787");
    const html = await res.text();
    await pause(2000);
    assert.strictEqual(/www/gm.test(html), true);
    assert.strictEqual(/fiveserver.config.cjs/gm.test(html), true);
    return;
  });

  test("close five-server", async () => {
    const res2 = await vscode.commands.executeCommand("fiveServer.close");
    assert.strictEqual(res2, "done");
    return pause(500);
  });
});

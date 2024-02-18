import * as path from "path";
import * as cp from "child_process";

import { downloadAndUnzipVSCode, resolveCliArgsFromVSCodeExecutablePath, runTests } from "@vscode/test-electron";
import { readFile } from "fs/promises";

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");
    const extensionTestsPath = path.resolve(__dirname, "./suite/index");
    const extensionTestsPath2 = path.resolve(__dirname, "./suite2/index");
    const testWorkspace = path.resolve(__dirname, "../../test-fixtures/workspace");
    const testWorkspace2 = path.resolve(__dirname, "../../test-fixtures/workspace2");
    console.log(path.resolve(__dirname, "../../package.json"));
    const pkg = await readFile(path.resolve(__dirname, "../../package.json"), "utf-8");
    const version = JSON.parse(pkg).version;

    // Test the vsix package
    const vscodeExecutablePath = await downloadAndUnzipVSCode(undefined);
    const [cliPath, ...args] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);

    // Use cp.spawn / cp.exec for custom setup
    cp.spawnSync(cliPath, [...args, "--list-extensions"], {
      encoding: "utf-8",
      stdio: "inherit",
    });

    // Use cp.spawn / cp.exec for custom setup
    cp.spawnSync(cliPath, [...args, "--uninstall-extension", "yandeu.five-server"], {
      encoding: "utf-8",
      stdio: "inherit",
    });

    // Use cp.spawn / cp.exec for custom setup
    cp.spawnSync(
      cliPath,
      [...args, "--install-extension", path.resolve(__dirname, `../../five-server-${version}.vsix`)],
      {
        encoding: "utf-8",
        stdio: "inherit",
      },
    );

    // Run the extension test
    await runTests({
      // Use the specified `code` executable
      vscodeExecutablePath,
      extensionDevelopmentPath: path.resolve(__dirname, "./mock"),
      extensionTestsPath,
      launchArgs: [testWorkspace],
    });

    // Download VS Code, unzip it and run the integration test
    // (latest version)
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        testWorkspace,
        // This disables all extensions except the one being tested
        "--disable-extensions",
      ],
    });
    // test workspace2
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath: extensionTestsPath2,
      launchArgs: [
        testWorkspace2,
        // This disables all extensions except the one being tested
        "--disable-extensions",
      ],
    });

    // Download VS Code, unzip it and run the integration test
    // (version 1.66.2 / March 2022 / Electron v17 with Node.js v16.13)
    await runTests({
      version: "1.66.2",
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        testWorkspace,
        // This disables all extensions except the one being tested
        "--disable-extensions",
      ],
    });
  } catch (err) {
    console.error("Failed to run tests");
    process.exit(1);
  }
}

main();

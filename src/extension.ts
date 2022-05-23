/* eslint-disable @typescript-eslint/naming-convention */

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import type FiveServer from "five-server";
import type { LiveServerParams } from "five-server";

import { getConfigFile } from "five-server/lib/misc";
import { message } from "five-server/lib/msg";

import { PTY } from "./pty";
import { join, extname, basename } from "path";
import { decorate, refreshDecorations } from "./decorator";
import {
  assignVSCodeConfiguration,
  colors,
  getConfig,
  namespace,
} from "./helpers";

let openURL = "";
let pty: PTY;
let activeFileName = "";
let root: string = "";
let _root: string | null = null;
let workspace: string | undefined;
let rootAbsolute: string;
let config: LiveServerParams = {};
let fiveServer: FiveServer | undefined;
let myStatusBarItem: vscode.StatusBarItem;
let debug = false;

const state = `${namespace}.state`;
const openCommand = `${namespace}.open`;
const openRootCommand = `${namespace}.openRoot`;
const startCommand = `${namespace}.start`;
const closeCommand = `${namespace}.close`;
const statusBarItemCommand = `${namespace}.statusBar`;

const page = {
  current: { text: "", fileName: "" },
  last: { text: "", fileName: "" },
};

const updatePage = (fileName: string | undefined, text: string | undefined) => {
  if (!fileName) return;
  if (!text) return;

  const _current = { ...page.current };
  page.current = { text, fileName };
  page.last = _current;
};

const isHtml = (file: string | undefined) => {
  if (!file) return false;
  return /\.html$/.test(file);
};

const isPhp = (file: string | undefined) => {
  if (!file) return false;
  return /\.php$/.test(file);
};

const isCss = (file: string | undefined) => {
  if (!file) return false;
  return /\.css$/.test(file);
};

const isJs = (file: string | undefined) => {
  if (!file) return false;
  return /\.js$/.test(file);
};

// check for </head> </body> or </html>tag
const containsTags = (text: string) => {
  return /<\/head>|<\/body>|<\/html>/gm.test(text);
};

// navigate to .html and .php files
const shouldNavigate = (file?: string, text?: string): boolean => {
  if (!file) return false;
  if (!text) return false;
  if (config && config.navigate === false) return false;
  if (!isHtml(file) && !isPhp(file)) return false;

  // do not navigate to a .html file that does not contain the required tags.
  if ((isHtml(file) || isPhp(file)) && !containsTags(text)) {
    message.pretty(`File: ${file} does not contain required HTML tags.`, {
      id: "vscode",
    });
    return false;
  }

  if (config && config.navigate === true) return true;
  return false;
};

// highlight only .html files
const shouldHighlight = (file: string | undefined) => {
  if (config && config.highlight === true) return true;
  if (!isHtml(file)) return false;
  return false;
};

// default: true
const shouldInjectCss = () => {
  if (config && config.injectCss === false) return false;
  return true;
};

// default: false
const shouldInjectBody = () => {
  if (config && config.injectBody === true) return true;
  return false;
};

export function activate(context: vscode.ExtensionContext) {
  context.workspaceState.update(state, "off");

  // vscode.window.showInformationMessage("Plugin Activated");

  // navigate to new file
  vscode.window.onDidChangeActiveTextEditor((e) => {
    if (!fiveServer?.isRunning) return;

    refreshDecorations(e?.document.fileName, { force: true });

    navigate(e?.document.fileName, e?.document.getText());
  });

  // change highlight
  vscode.window.onDidChangeTextEditorSelection((e) => {
    if (!fiveServer?.isRunning) return;

    const fileName = e.textEditor.document.fileName;
    const text = e.textEditor.document.getText();

    if (!isHtml(fileName) && !isPhp(fileName)) return;
    if (!shouldInjectBody()) return;

    updatePage(fileName, text);
    updateBody(fileName);
  });

  // reload browser
  vscode.workspace.onDidSaveTextDocument((e) => {
    if (!fiveServer?.isRunning) return;

    // don't reload browser if we modify css and inject css
    if (shouldInjectCss() && isCss(e.fileName)) return;

    fiveServer.reloadBrowserWindow();

    // // we do not highlight other file than .html
    if (!isHtml(e.fileName)) return;
    if (!shouldInjectBody()) return;

    // // TODO: Maybe this needs improvement?

    updateBody(e.fileName);

    setTimeout(() => updateBody(e.fileName), 250);
    setTimeout(() => updateBody(e.fileName), 500);
    setTimeout(() => updateBody(e.fileName), 1000);
  });

  // inject body into .html file
  vscode.workspace.onDidChangeTextDocument((e) => {
    if (!fiveServer?.isRunning) return;

    if (!isHtml(e.document.fileName) && !isPhp(e.document.fileName)) return;
    if (!shouldInjectBody()) return;

    updatePage(e.document.fileName, e.document.getText());
    updateBody(page.current.fileName);
  });

  const updateBody = (fileName: string) => {
    if (page.current.fileName !== page.last.fileName) return;

    if (!isHtml(fileName) && !isPhp(fileName)) return;
    if (!shouldInjectBody()) return;

    fiveServer?.parseBody.updateBody(
      fileName,
      page.current.text,
      shouldHighlight(fileName),
      vscode.window.activeTextEditor?.selection.active
    );
  };

  const navigate = (fileName: string | undefined, text: string | undefined) => {
    if (!fiveServer?.isRunning) return;
    if (!fileName) return;
    if (!text) return;

    if (!shouldNavigate(fileName, text)) return;

    if (activeFileName === fileName) return;
    activeFileName = fileName;

    if (fileName && workspace) {
      fileName = fileName.replace(rootAbsolute, "").replace(/^\\|^\//gm, "");
      fiveServer.navigate(`/${fileName}`);
    }
  };

  const updateStatusBarItem = (context: vscode.ExtensionContext) => {
    const _state = context.workspaceState.get(state);

    if (_state === "on") {
      myStatusBarItem.text = `$(zap) ${openURL}`;
      myStatusBarItem.tooltip = "Close Five Server";
      myStatusBarItem.color = colors.yellow;
      myStatusBarItem.show();
    } else if (_state === "loading") {
      myStatusBarItem.text = `$(sync~spin) Going Live...`;
      myStatusBarItem.color = undefined;
      myStatusBarItem.show();
    } else {
      myStatusBarItem.text = `$(play-circle) Go Live`;
      myStatusBarItem.tooltip = "Open Five Server";
      myStatusBarItem.color = undefined;
      myStatusBarItem.show();
    }
  };

  let lastMessage = "";
  const messageHandler = (message: any) => {
    if (lastMessage !== message && pty && message && message.msg) {
      pty.write(message.msg);
    }

    lastMessage = message;
  };

  const startServer = async (uri: vscode.Uri) => {
    let startWorkers = false;

    context.workspaceState.update(state, "loading");
    updateStatusBarItem(context);

    if (!pty) pty = new PTY(getConfig("openTerminal"));

    if (!fiveServer) {
      const FiveServer = await import("five-server");
      fiveServer = new FiveServer.default();
      startWorkers = true;
    }

    // @ts-ignore
    message.removeListener("message", messageHandler);
    // @ts-ignore
    message.addListener("message", messageHandler);

    // reset config
    config = {};
    // get config from VSCode
    config = assignVSCodeConfiguration();

    workspace = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    if (workspace) {
      // get file stat (if uri is available)
      const stat = uri ? await vscode.workspace.fs.stat(uri) : null;
      // open directory as root (1 = File; 2 = Directory)
      if (stat?.type === 2) _root = uri.fsPath.replace(workspace, "");

      // get configFile for "root, injectBody and highlight"
      config = { ...config, ...(await getConfigFile(true, workspace)) };

      if (_root) root = _root;
      else if (config && config.root) root = config.root;
      else root = "";

      // @ts-ignore
      if (config && config.debugVSCode === true) debug = true;
      else debug = false;

      rootAbsolute = join(workspace, root);

      if (debug) {
        pty.write(
          "DEBUG:",
          '"workspace", "root" and "open" will be passed to fiveServer.start()'
        );
        pty.write("Workspace:", workspace);
        pty.write("Root:", root);
        pty.write("Absolute (workspace + root):", rootAbsolute);
        pty.write("File:", uri?.fsPath);
      }

      if (workspace && typeof root !== "undefined" && uri?.fsPath) {
        let file = uri.fsPath
          .replace(rootAbsolute, "")
          .replace(/^\\|^\//gm, "");

        const isFile = extname(file) !== "";

        // serve .preview for all "files" other than .html and .php
        if (isFile && !isHtml(file) && !isPhp(file)) file += ".preview";

        activeFileName = file;

        if (debug) pty.write("Open:", file);

        await fiveServer.start({
          ...config,
          injectBody: shouldInjectBody(),
          open: file,
          root,
          workspace,
          _cli: true,
        });
      } else {
        if (debug) pty.write("Open:", "");

        await fiveServer.start({
          ...config,
          injectBody: shouldInjectBody(),
          root,
          workspace,
          _cli: true,
        });
      }
    } else if (!workspace) {
      // no workspace?
      // the user opened probably only a single file instead of a folder
      message.pretty(
        'No Workspace found! You probably opened a "single file" instead of a "folder".',
        { id: "vscode" }
      );

      // we get the path and filename from the window
      const fileName = vscode.window.activeTextEditor?.document.fileName;
      if (!fileName) {
        message.pretty("Could not detect a valid file.", { id: "vscode" });

        context.workspaceState.update(state, "off");
        updateStatusBarItem(context);
        return;
      }

      const file = basename(fileName);
      const root = fileName.replace(file, "");

      // start a simple server
      await fiveServer.start({
        root,
        open: file,
      });
    }

    openURL = fiveServer.openURL;
    context.workspaceState.update(state, "on");
    updateStatusBarItem(context);

    // start workers
    if (startWorkers) {
      fiveServer.parseBody.workers.on("message", (msg: any) => {
        const json = JSON.parse(msg);

        if (json.report && json.report.results) {
          const results = json.report.results;

          if (results.length === 0) {
            decorate(page.current.fileName, [], colors.yellow);
            return;
          }

          const htmlErrors = results[0].messages.map((m: any) => {
            const { message, ruleId, line } = m;
            return { message, ruleId, line };
          });

          decorate(
            page.current.fileName,
            htmlErrors.map((e: any) => {
              return { text: `// ${e.message}`, line: e.line };
            }),
            colors.yellow
          );
        }
      });
    }

    return "done";
  };

  const closeServer = () => {
    context.workspaceState.update(state, "loading");
    updateStatusBarItem(context);

    // @ts-ignore
    message.removeListener("message", messageHandler);

    // reset tmp root
    _root = null;

    if (fiveServer) {
      fiveServer.shutdown().then(() => {
        // @ts-ignore
        fiveServer = null;

        context.workspaceState.update(state, "off");
        updateStatusBarItem(context);
      });
    }

    if (pty) {
      pty.dispose();
      // @ts-ignore
      pty = null;
    }

    return "done";
  };

  const toggleServer = () => {
    const _state = context.workspaceState.get(state);

    if (_state === "on") vscode.commands.executeCommand(closeCommand);
    else if (_state === "off") vscode.commands.executeCommand(startCommand);
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(startCommand, startServer)
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(openCommand, startServer)
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(openRootCommand, startServer)
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(closeCommand, closeServer)
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(statusBarItemCommand, toggleServer)
  );

  // create a new status bar item that we can now manage
  myStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    0
  );
  myStatusBarItem.command = statusBarItemCommand;
  updateStatusBarItem(context);
  context.subscriptions.push(myStatusBarItem);
}

export function deactivate(context: vscode.ExtensionContext) {
  vscode.commands.executeCommand(closeCommand);
}

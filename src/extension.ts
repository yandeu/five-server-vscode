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
import { assignVSCodeConfiguration, colors, getConfig, namespace } from "./helpers";

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
const openViaShortcutCommand = `${namespace}.openViaShortcut`;
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
      vscode.window.activeTextEditor?.selection.active,
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

  const updateStatusBarItem = (status: String) => {
    if (status === "on") {
      myStatusBarItem.text = `$(zap) ${openURL}`;
      myStatusBarItem.tooltip = "Close Five Server";
      myStatusBarItem.color = colors.yellow;
      myStatusBarItem.show();
    } else if (status === "loading") {
      myStatusBarItem.text = `$(sync~spin) Going Live...`;
      myStatusBarItem.tooltip = "Loading Five Server";
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

  // right-click on folder in explorer (open as root)
  const startServerRoot = async (uri: vscode.Uri) => {
    const directoryPath = uri.fsPath;
    const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (workspacePath) {
      const rootPath = directoryPath.replace(workspacePath, "").replace(/^\//, "");
      const stat = await vscode.workspace.fs.stat(uri);
      // is directory
      if (stat.type === vscode.FileType.Directory) {
        await startServer(uri, { rootPath });
      }
    }
  };

  // open on shortcut (alt+L alt+O)
  const openViaShortcut = async (uri: vscode.Uri) => {
    // get current open file
    const fileToOpen = vscode.window.activeTextEditor?.document.fileName;
    await startServer(uri, { fileToOpen });
  };

  type StartServerOptions = {
    fileToOpen?: string;
    rootPath?: string;
  };

  const startServer = async (uri: vscode.Uri, startServerOptions: StartServerOptions = {}) => {
    const { fileToOpen, rootPath } = startServerOptions;

    let startWorkers = false;

    // "on" or "off"
    const lastServerState = context.workspaceState.get<string>(state) || "off";

    updateStatusBarItem("loading");
    context.workspaceState.update(state, "loading");

    // display loading text
    await new Promise((r) => setTimeout(r, 250));

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

    config = {}; // reset config
    config = assignVSCodeConfiguration(); // get config from VSCode

    workspace = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    if (workspace) {
      // get configFile for "root, injectBody and highlight"
      config = { ...config, ...(await getConfigFile(true, workspace)) };

      // if five-server is on, and the current root path is not the same as requested,
      // change the root of five-server by shutting it down, and later start it again.
      if (lastServerState === "on" && rootPath !== root) {
        await fiveServer.shutdown();
      }

      if (typeof rootPath === "string") root = rootPath;
      // if the server is already running, use the current root directory
      else if (lastServerState === "on") root = root;
      else if (config && config.root) root = config.root;
      else root = "";

      // @ts-ignore
      if (config && config.debugVSCode === true) debug = true;
      else debug = false;

      rootAbsolute = join(workspace, root);

      if (debug) {
        pty.debug("DEBUG:", '"workspace", "root" and "open" will be passed to fiveServer.start()');
        pty.debug("Workspace:", workspace);
        pty.debug("Root:", root);
        pty.debug("Absolute (workspace + root):", rootAbsolute);
        pty.debug("File:", uri?.fsPath);
        pty.debug("LastServerState:", lastServerState);
      }

      /**
       * Open a file when clicking "Open with Five Server" in the context menu of a file.
       * OR
       * Open "fileToOpen" when using the shortcut (alt+L alt+O).
       */
      if (uri?.fsPath || fileToOpen) {
        let file = fileToOpen ? fileToOpen : uri?.fsPath;

        if (debug) {
          pty.debug("file:", file);
          pty.debug("fileToOpen:", fileToOpen || "");
          pty.debug("uri.fsPath:", uri?.fsPath);
        }
        file = file.replace(rootAbsolute, "").replace(/^\\|^\//gm, "");

        let isFile = false;
        if (uri) {
          const stat = await vscode.workspace.fs.stat(uri);
          if (stat && stat.type === vscode.FileType.File) {
            isFile = true;
          }
        }
        if (fileToOpen) {
          isFile = true;
        }

        // serve .preview for all "files" other than .html and .php
        if (isFile && !isHtml(file) && !isPhp(file)) file += ".preview";

        activeFileName = file;

        if (debug) pty.write("Open:", file);

        await fiveServer.start({
          ...config,
          injectBody: shouldInjectBody(),
          open: config.open !== undefined ? config.open : file,
          root,
          workspace,
          _cli: true,
        });
      }
      /**
       * Open Five Server at "/", or at whatever is specified in the config file,
       * when clicking on "Go Live" in the status bar.
       */
      //
      else {
        // let file = "";

        // get current open file
        // const fileName = vscode.window.activeTextEditor?.document.fileName;
        // if (fileName) file = fileName.replace(rootAbsolute, "").replace(/^\\|^\//gm, "");

        // if (debug) pty.write("Open:", file);

        await fiveServer.start({
          ...config,
          injectBody: shouldInjectBody(),
          // open: config.open !== undefined ? config.open : file,
          open: config.open !== undefined ? config.open : "/",
          root,
          workspace,
          _cli: true,
        });
      }
    }
    //
    else if (!workspace) {
      // no workspace?
      // the user opened probably only a single file instead of a folder
      message.pretty('No Workspace found! You probably opened a "single file" instead of a "folder".', {
        id: "vscode",
      });

      // we get the path and filename from the window
      const fileName = vscode.window.activeTextEditor?.document.fileName;
      if (!fileName) {
        message.pretty("Could not detect a valid file.", { id: "vscode" });

        updateStatusBarItem("off");
        context.workspaceState.update(state, "off");
        return;
      }

      const file = basename(fileName);
      const root = fileName.replace(file, "");

      // start a simple server
      await fiveServer.start({
        ...config,
        injectBody: shouldInjectBody(),
        root,
        open: file,
      });
    }

    openURL = fiveServer.openURL;
    updateStatusBarItem("on");
    context.workspaceState.update(state, "on");

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
            colors.yellow,
          );
        }
      });
    }

    return "done";
  };

  const closeServer = () => {
    updateStatusBarItem("loading");
    context.workspaceState.update(state, "loading");

    // @ts-ignore
    message.removeListener("message", messageHandler);

    // reset tmp root
    _root = null;

    if (fiveServer) {
      fiveServer.shutdown().then(() => {
        // @ts-ignore
        fiveServer = null;

        updateStatusBarItem("off");
        context.workspaceState.update(state, "off");
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

  // open via context menu of file or a file in the explorer
  context.subscriptions.push(vscode.commands.registerCommand(openCommand, startServer));

  // open via context menu of a folder the explorer
  context.subscriptions.push(vscode.commands.registerCommand(openRootCommand, startServerRoot));

  // open via shortcut (alt+L alt+O)
  context.subscriptions.push(vscode.commands.registerCommand(openViaShortcutCommand, openViaShortcut));

  // clicking "Go Live" in status bar (toggle, start, close)
  context.subscriptions.push(vscode.commands.registerCommand(statusBarItemCommand, toggleServer));
  context.subscriptions.push(vscode.commands.registerCommand(startCommand, startServer));
  context.subscriptions.push(vscode.commands.registerCommand(closeCommand, closeServer));

  // create a new status bar item that we can now manage
  myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
  myStatusBarItem.command = statusBarItemCommand;
  updateStatusBarItem("off");
  context.subscriptions.push(myStatusBarItem);
}

export function deactivate(context: vscode.ExtensionContext) {
  vscode.commands.executeCommand(closeCommand);
}

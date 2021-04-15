// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import FiveServer, { LiveServerParams } from "five-server";
import { getConfigFile } from "five-server/lib/misc";
import { message } from "five-server/lib/msg";
import { PTY } from "./pty";
import { join, extname, basename } from "path";

let openURL = "";
let pty: PTY;
let activeFileName = "";
let root: string = "";
let workspace: string | undefined;
let rootAbsolute: string;
let config: LiveServerParams = {};
let fiveServer: FiveServer | undefined;
let myStatusBarItem: vscode.StatusBarItem;
let debug = false;

const state = "vscode-five-server.state";
const openCommand = "vscode-five-server.open";
const startCommand = "vscode-five-server.start";
const closeCommand = "vscode-five-server.close";
const statusBarItemCommand = "vscode-five-server.statusBar";

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
const shouldNavigate = (file: string | undefined, text: string | undefined) => {
  if (!file) return;
  if (!text) return;
  if (config && config.navigate === false) return false;
  if (!isPhp(file) && !isHtml(file)) return false;

  // TODO(yandeu): fix this block
  // do not navigate to a .html file that does not contain the required tags.
  if (isHtml(file) && !containsTags(text)) {
    message.pretty(`File: ${file} does not contain required HTML tags.`, {
      id: "vscode",
    });
    return false;
  }

  return true;
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

    navigate(e?.document.fileName, e?.document.getText());
  });

  // change highlight
  vscode.window.onDidChangeTextEditorSelection((e) => {
    if (!fiveServer?.isRunning) return;

    const fileName = e.textEditor.document.fileName;

    if (!isHtml(fileName)) return;

    const position = getPosition(
      e.textEditor.selection.active,
      e.textEditor.document.getText()
    );

    if (shouldHighlight(fileName) && position)
      fiveServer.highlight(e.textEditor.document.fileName, position);
  });

  // reload browser
  vscode.workspace.onDidSaveTextDocument((e) => {
    if (!fiveServer?.isRunning) return;

    // don't reload browser if we modify css and inject css
    if (shouldInjectCss() && isCss(e.fileName)) return;

    fiveServer.reloadBrowserWindow();

    // we do not highlight other file than .html
    if (!isHtml(e.fileName)) return;

    // TODO: Maybe this needs improvement?
    const sendPosition = () => {
      const position = getPosition(
        vscode.window.activeTextEditor?.selection.active,
        e.getText()
      );
      if (shouldHighlight(e.fileName) && position)
        fiveServer?.highlight(e.fileName, position);
    };

    setTimeout(sendPosition, 250);
    setTimeout(sendPosition, 500);
    setTimeout(sendPosition, 1000);
  });

  // inject body into .html file
  vscode.workspace.onDidChangeTextDocument((e) => {
    if (!fiveServer?.isRunning) return;

    if (!isHtml(e.document.fileName)) return;

    if (!shouldInjectBody()) return;

    const res = /<body[^>]*>((.|[\n\r])*)<\/body>/gim.exec(
      e.document.getText()
    );

    const position = getPosition(
      vscode.window.activeTextEditor?.selection.active,
      e.document.getText()
    );

    if (res && res[1]) {
      const body = res[1];
      fiveServer.updateBody(
        e.document.fileName,
        body,
        shouldHighlight(e.document.fileName) ? position : undefined
      );
    }
  });

  const getPosition = (
    position: vscode.Position | undefined,
    text: string | undefined
  ) => {
    if (!fiveServer?.isRunning) return;
    if (!position || !text) return;

    if (position) {
      const lines = text.split("\n");
      let lineShift = 0;

      for (let i = 0; i < lines.length - 1; i++) {
        if (/<body/gm.test(lines[i])) {
          lineShift = i;
          break;
        }
      }

      return { line: position.line - lineShift, character: position.character };
    } else return;
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
      myStatusBarItem.color = "#ebb549";
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
    if (!pty) pty = new PTY();
    if (!fiveServer) fiveServer = new FiveServer();

    // @ts-ignore
    message.removeListener("message", messageHandler);

    // @ts-ignore
    message.addListener("message", messageHandler);

    context.workspaceState.update(state, "loading");
    updateStatusBarItem(context);

    config = {};

    workspace = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    if (workspace) {
      // Get configFile for "root, injectBody and highlight"
      config = await getConfigFile(true, workspace);
      if (config && config.root) root = config.root;

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
  };

  const closeServer = () => {
    context.workspaceState.update(state, "loading");
    updateStatusBarItem(context);

    // @ts-ignore
    message.removeListener("message", messageHandler);

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

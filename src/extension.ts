// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import FiveServer, { LiveServerParams } from "five-server";
import { getConfigFile } from "five-server/lib/misc";
import { PTY } from "./pty";
import { join } from "path";

let openURL = "";
let pty: PTY;
let activeFileName = "";
let root: string = "";
let workspace: string | undefined;
let rootAbsolute: string;
let config: LiveServerParams = {};
let fiveServer: FiveServer | undefined;
let myStatusBarItem: vscode.StatusBarItem;

const state = "vscode-five-server.state";
const openCommand = "vscode-five-server.open";
const startCommand = "vscode-five-server.start";
const closeCommand = "vscode-five-server.close";
const statusBarItemCommand = "vscode-five-server.statusBar";

const isHtml = (file: string | undefined) => {
  if (!file) return false;
  return /\.html$/.test(file);
};

const shouldNavigate = () => {
  if (config && config.navigate === false) return false;
  return true;
};

const shouldHighlight = () => {
  if (config && config.highlight === true) return true;
  return false;
};

const shouldInjectBody = () => {
  if (config && config.injectBody === true) return true;
  return false;
};

export function activate(context: vscode.ExtensionContext) {
  context.workspaceState.update(state, "off");

  // vscode.window.showInformationMessage("Plugin Activated");

  vscode.window.onDidChangeActiveTextEditor((e) => {
    if (!fiveServer?.isRunning) return;
    if (!isHtml(e?.document.fileName)) return;

    navigate(e?.document.fileName);
  });

  vscode.window.onDidChangeTextEditorSelection((e) => {
    if (!fiveServer?.isRunning) return;
    if (!isHtml(e.textEditor.document.fileName)) return;

    navigate(e.textEditor.document.fileName);

    const position = getPosition(
      e.textEditor.selection.active,
      e.textEditor.document.getText()
    );

    if (shouldHighlight() && position)
      fiveServer.highlight(e.textEditor.document.fileName, position);
  });

  vscode.workspace.onDidSaveTextDocument((e) => {
    if (!fiveServer?.isRunning) return;
    if (!isHtml(e.fileName)) return;

    fiveServer.reloadBrowserWindow();

    // TODO: Maybe this needs improvement?
    const sendPosition = () => {
      const position = getPosition(
        vscode.window.activeTextEditor?.selection.active,
        e.getText()
      );
      if (shouldHighlight() && position)
        fiveServer?.highlight(e.fileName, position);
    };

    setTimeout(sendPosition, 250);
    setTimeout(sendPosition, 500);
    setTimeout(sendPosition, 1000);
  });

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
        shouldHighlight() ? position : undefined
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

  const navigate = (fileName: string | undefined) => {
    if (!fiveServer?.isRunning) return;
    if (!isHtml(fileName)) return;

    if (
      typeof fileName === "undefined" ||
      !fiveServer.isRunning ||
      !shouldNavigate()
    )
      return;

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
      myStatusBarItem.text = `$(circle-slash) ${openURL}`;
      myStatusBarItem.tooltip = "Close Five Server";
      myStatusBarItem.show();
    } else if (_state === "loading") {
      myStatusBarItem.text = `$(sync~spin) Going Live...`;
      myStatusBarItem.show();
    } else {
      myStatusBarItem.text = `$(broadcast) Go Live`;
      myStatusBarItem.tooltip = "Open Five Server";
      myStatusBarItem.show();
    }
  };

  const startServer = async (uri: vscode.Uri) => {
    if (!pty) pty = new PTY();
    if (!fiveServer) fiveServer = new FiveServer();

    context.workspaceState.update(state, "loading");
    updateStatusBarItem(context);

    workspace = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    if (!workspace) {
      console.error("workspace 0 not found!");
      return;
    }

    // Get configFile for "root, injectBody and highlight"
    config = await getConfigFile(true, workspace);
    if (config && config.root) root = config.root;

    rootAbsolute = join(workspace, root);

    if (workspace && typeof root !== "undefined" && uri?.fsPath) {
      const file = uri.fsPath
        .replace(rootAbsolute, "")
        .replace(/^\\|^\//gm, "");

      activeFileName = file;

      await fiveServer.start({
        workspace,
        root,
        open: file,
        injectBody: shouldInjectBody(),
      });
    } else {
      await fiveServer.start({
        workspace,
        root,
        injectBody: shouldInjectBody(),
      });
    }

    openURL = fiveServer.openURL;
    context.workspaceState.update(state, "on");
    updateStatusBarItem(context);
  };

  const closeServer = () => {
    context.workspaceState.update(state, "off");
    updateStatusBarItem(context);
    if (fiveServer) {
      fiveServer.shutdown();
      // @ts-ignore
      fiveServer = null;
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
    100
  );
  myStatusBarItem.command = statusBarItemCommand;
  updateStatusBarItem(context);
  context.subscriptions.push(myStatusBarItem);
}

export function deactivate(context: vscode.ExtensionContext) {
  vscode.commands.executeCommand(closeCommand);
}

import * as vscode from "vscode";

export class PTY {
  writeEmitter: vscode.EventEmitter<string>;
  terminal: vscode.Terminal;

  constructor() {
    this.writeEmitter = new vscode.EventEmitter<string>();

    const pty: vscode.Pseudoterminal = {
      onDidWrite: this.writeEmitter.event,
      open: () => {},
      close: () => {},
      handleInput: (data) =>
        this.writeEmitter.fire(data === "\r" ? "\r\n" : data + "\r\n"),
    };

    this.terminal = vscode.window.createTerminal({ name: "Five Server", pty });

    // hide cursor
    this.terminal.sendText("\u001B[?25l");

    const write = (type: any, message: any) => {
      const msg = message.join(" ");
      if (/\[\S+\]/gm.test(msg)) this.terminal.sendText(msg, true);
      type.apply(console, message);
    };

    const oldLog = console.log;
    console.log = function (...message: string[]) {
      write(oldLog, message);
    };

    const oldWarn = console.warn;
    console.warn = function (...message: string[]) {
      write(oldWarn, message);
    };

    const oldError = console.error;
    console.error = function (...message: string[]) {
      write(oldError, message);
    };
  }

  dispose() {
    this.terminal.dispose();
    this.writeEmitter.dispose();
  }
}

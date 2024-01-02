import * as vscode from "vscode";

export class PTY {
  writeEmitter: vscode.EventEmitter<string>;
  terminal: vscode.Terminal;

  lastWrite = "";

  public write(...message: string[]) {
    const write = message.join(" ");

    // somewhere is a bug that send every message twice :/
    if (this.lastWrite === write) return;

    this.terminal.sendText(write, true);
    this.lastWrite = write;
  }

  constructor(open = true) {
    this.writeEmitter = new vscode.EventEmitter<string>();

    const pty: vscode.Pseudoterminal = {
      onDidWrite: this.writeEmitter.event,
      open: () => {},
      close: () => {
        this.writeEmitter.dispose();
      },
      handleInput: (data) => this.writeEmitter.fire(data === "\r" ? "\r\n" : data + "\r\n"),
    };

    this.terminal = vscode.window.createTerminal({ name: "Five Server", pty });
    if (open) this.terminal.show();

    // hide cursor
    this.terminal.sendText("\u001B[?25l");
  }

  dispose() {
    this.terminal.dispose();
  }
}

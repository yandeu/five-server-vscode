import * as vscode from "vscode";

export const isDarkTheme = () => {
  const theme = vscode.window.activeColorTheme;
  return theme.kind === vscode.ColorThemeKind.Dark;
};

export const colors = {
  get yellow() {
    return isDarkTheme() ? "#ebb549" : "#f69d50";
  },
};

export const strToHash = (s: string) => {
  let hash = 0;

  for (let i = 0; i < s.length; i++) {
    const chr = s.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(32);
};

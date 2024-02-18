import * as vscode from "vscode";

export const namespace = "fiveServer";

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

export const getConfig = <T>(config: string): T =>
  vscode.workspace.getConfiguration().get(`${namespace}.${config}`) as T;

export const assignVSCodeConfiguration = () => {
  const browser = <string[]>getConfig("browser");
  const ignore = <string[]>getConfig("ignore");
  const navigate = <boolean>getConfig("navigate");
  const php = <string>getConfig("php.executable");
  const phpIni = <string>getConfig("php.ini");
  const baseURL = <string>getConfig("baseURL");
  const host = <string>getConfig("host");
  const port = <number>getConfig("port");
  const injectBody = <boolean>getConfig("injectBody");
  const highlight = <boolean>getConfig("highlight");

  return {
    browser,
    ignore,
    navigate,
    php,
    phpIni,
    baseURL,
    host,
    port,
    injectBody,
    highlight,
  };
};

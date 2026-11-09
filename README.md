<p align="center">
  <img
    src="https://raw.githubusercontent.com/yandeu/five-server-vscode/main/img/icon.png"
    height="100"
    width="134"
  />
</p>

<h1 align="center">Five Server</h1>

<p align="center">
  A better <em><b>live server</b></em>
</p>

<p align="center">
  <a
    href="https://marketplace.visualstudio.com/items?itemName=yandeu.five-server"
    target="__blank"
  >
    <img alt="VERSION" src="https://badgen.net/vs-marketplace/v/yandeu.five-server?color=228cb3&label="/>
    <img alt="Visual Studio Marketplace Rating" src="https://img.shields.io/visual-studio-marketplace/r/yandeu.five-server?color=228cb3">
  </a>
  <a href="https://github.com/sponsors/yandeu" target="__blank">
    <img alt="GitHub Sponsors" src="https://img.shields.io/github/sponsors/yandeu?color=228cb3">
  </a>
</p>

- ⚡️ **Updates your files instantly** while typing on your keyboard
- ⬢ Shows the logs of your browser or phone in your terminal
- 💡 Highlights the code you are working on in your browser
- 🚀 Navigates your browser automatically to the current editing file
- 🐘 Includes **PHP Support** for serving and live reload all your `.php` files
- 🗄️ Supports all **Server Side Rendered Apps** like express.js

<p>
  <a href="https://youtu.be/aETkOu8J-bo">
    <img src="https://raw.githubusercontent.com/yandeu/five-server/main/img/vscode-preview.gif" alt="demo">
  </a>
</p>

## Get Started

4 ways to start your live server.

1. Click **Go Live** in the Status Bar (bottom of VSCode)
2. Right-Click an Open File > **Open with Five Server**
3. Right-Click a File in the Explorer > **Open with Five Server**
4. Right-Click a Folder in the Explorer > **Open with Five Server (root)**  
   _(will set the current folder as root until you stop the server)_

To stop the server, click the **Go Live** item in the Status Bar again, or run **Five-Server: Close** from the Command Palette.

Keyboard shortcuts (while the editor has focus):

- `Alt+L Alt+O` opens the current file with Five Server (`Cmd+L Cmd+O` on macOS).
- `Alt+L Alt+C` closes Five Server (`Cmd+L Cmd+C` on macOS).

## Videos

- [Instant Update](https://youtu.be/3-zKYNrxKOk)
- [Instant Update (with PHP)](https://youtu.be/4s7q5chX-e0)
- [New Highlight Styles](https://youtu.be/zlKxvw-vy_M)

## Quick Test

Something is not working? Try the simple setup below:

- make sure you have uninstalled the old **Live Server**
- check if you have the latest version  
  [![VERSION](https://badgen.net/vs-marketplace/v/yandeu.five-server?color=228cb3&label=)](https://marketplace.visualstudio.com/items?itemName=yandeu.five-server)
- make a new folder `www` on the desktop
- add the `index.html` (see below)
- open the folder `www` with VSCode
- click on **Go Live**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>HTML Test File</title>
  </head>
  <body>
    <h1>It works!</h1>
  </body>
</html>
```

The setup above works but your project not?

- Maybe because your project is on another drive?
- Or maybe on a USB Stick or remote folder like `OneDrive` or `Dropbox`?
- Make sure you open a folder in VSCode and NOT just a single file.
- All these things can sometimes cause issues.

## About PHP

Although Five Server can render, display and live reload PHP, it does not provide a full PHP server. If you want to develop a big PHP app, you manually have to link the client-side Five Server script with your PHP files. See [five-server-with-php](https://github.com/yandeu/five-server-with-php).

To serve `.php` files, set the path to your PHP executable in the settings with `fiveServer.php.executable`. Use `fiveServer.php.ini` to point to a `php.ini` file.

## Features

💡 Most **advanced features** are disabled by default.  
Turn them on in the settings or by configuring a config file in the root of your workspace. The config file can be named `fiveserver.config.js` (or `.cjs` / `.mjs`), or `.fiveserverrc` (or `.fiveserverrc.json`, `.js`, `.cjs`, `.mjs`). The config file is read each time the server starts, so restart the server after you change it.

Note:

- **Instant Update** & **Highlight** work with `.html` and `.php` files.
- **Instant Update** needs `injectBody`.
- **Auto navigation** (`navigate`) only opens `.html` and `.php` files that contain a `</head>`, `</body>` or `</html>` tag.
- Opening a file that is not `.html` or `.php`, such as a `.js` or `.css` file, shows a preview of that file.
- All remote logs will be visible in a new Terminal called "Five Server".
- The features `highlight`, `injectBody`, `navigate` and `remoteLogs` are disabled by default.
- To use the `highlight` feature, `injectBody` has to be activated.
- Dotfiles such as `.env` are hidden by default. Set `fiveServer.dotFiles` in the settings, or `dotFiles: true` in the config file, to serve them. The `.git` folder is always hidden.
- `injectBody` performs some simple HTML Validation. When using `injectBody`, a message will be displayed if your HTML Page is invalid.
- To temporarily disable `highlight` for a single HTML Tag, add a **H**.  
  Example: `<div H>Don't highlight me</div>`

Config File Example:

```js
// fiveserver.config.js
module.exports = {
  highlight: true, // enable highlight feature
  injectBody: true, // enable instant update
  remoteLogs: "yellow", // enable remoteLogs and use the color yellow (true | false | Color)
  injectCss: false, // disable injecting css
  navigate: true, // enable auto-navigation
  dotFiles: false, // serve dotfiles such as .env (hidden by default)
};
```

### Settings

These settings are available in VS Code under **Settings > Extensions > Five Server**, or in `settings.json`. A value in the config file overrides the matching setting.

| Setting | Default | Description |
| --- | --- | --- |
| `fiveServer.host` | `127.0.0.1` | Address to listen on. See [Host and Network Access](#host-and-network-access). |
| `fiveServer.port` | `5500` | Port of the server. |
| `fiveServer.cors` | `true` | Origins allowed to read responses. See [CORS](#cors). |
| `fiveServer.dotFiles` | `false` | Serve dotfiles such as `.env`. |
| `fiveServer.injectBody` | `false` | Enable Instant Update. |
| `fiveServer.highlight` | `false` | Highlight the code you are editing in the browser. Needs `injectBody`. |
| `fiveServer.navigate` | `false` | Open the page of the file you are editing. |
| `fiveServer.browser` | `[]` | Browser to open, e.g. `"chrome"`. |
| `fiveServer.ignore` | `[]` | Files and folders to ignore while watching. |
| `fiveServer.openTerminal` | `false` | Show the Five Server terminal when the server starts. |
| `fiveServer.php.executable` | `""` | Path to the PHP executable. |
| `fiveServer.php.ini` | `""` | Path to a `php.ini` file. |

### Host and Network Access

`fiveServer.host` (settings) or `host` (config file) sets the address Five Server listens on. The default is `127.0.0.1`, so only your own computer can connect.

| `host` | Who can connect |
| --- | --- |
| `127.0.0.1` (default) | This computer only |
| `0.0.0.0` | Any device on your network, such as a phone or tablet |
| another address, e.g. `192.168.1.20` | Only that address |

To test on a phone on the same Wi-Fi, set `host` to `0.0.0.0`. Five Server then prints a **Network** URL in the terminal. Open that URL on your phone.

```js
// fiveserver.config.js
module.exports = {
  host: "0.0.0.0",
};
```

> **Warning:** `0.0.0.0` makes your project files reachable by every device on the network. Use it only on networks you trust, such as your home network. Do not use it on public Wi-Fi.

### CORS

Cross-origin requests happen when a page on one origin reads a response from another origin. An origin is the scheme, host, and port. For example, a frontend on `http://localhost:3000` that fetches data from Five Server on port `5500` makes a cross-origin request. The `cors` option controls which origins may read Five Server's responses.

| `fiveServer.cors` | Origins that may read responses |
| --- | --- |
| `true` (default) | This computer (`localhost`, `127.0.0.1`, `[::1]`) on any port. If `host` is `0.0.0.0` or a LAN address, your private network too (`10.x.x.x`, `172.16.x.x` to `172.31.x.x`, `192.168.x.x`). |
| `false` | None. Five Server sends no CORS headers. |
| a list, e.g. `["http://localhost:3000"]` | Only the listed origins. Strings must match exactly, including the port. |

The config file accepts two more forms: a regular expression in the list, and `'*'`, which allows any origin. `'*'` is unsafe because any website you visit can read Five Server's responses.

```js
// fiveserver.config.js
module.exports = {
  cors: ["http://localhost:3000", "http://192.168.1.26:5173"],
};
```

Pages that Five Server serves itself are same-origin, so they do not need CORS. To reach a backend that has no CORS headers, use the `proxy` option in the config file.

If both a setting and the config file set the same option, the config file wins. Use the settings for your defaults and the config file for per-project changes.

### More Docs

- Read [Five Server - Documentation](https://github.com/yandeu/five-server#documentation).
- Read [Five Server - Config File](https://github.com/yandeu/five-server#config-file).
- Check all available options for the **Config File** in [`/src/types.ts`](https://github.com/yandeu/five-server/blob/main/src/types.ts).
- Check all available colors for the **remoteLogs** in [`/src/colors.ts`](https://github.com/yandeu/five-server/blob/main/src/colors.ts).

### Known Issues

- Sometimes `injectBody` does not work well when using inline JavaScript inside `<body>`.  
  As a workaround, execute your inline scripts after Five Server is connected:

```html
<script>
  const main = () => {
    console.log("Some JavaScript Code...");
  };

  // wait for five-server to connect
  const five = document.querySelector('[data-id="five-server"]');
  if (five) five.addEventListener("connected", main);
  else window.addEventListener("load", main);
</script>
```

### Debug Mode

Need to debug something? Set `debugVSCode` to `true` in the config file. It is not available as a setting. Debug messages are written to the Five Server terminal.

```js
// fiveserver.config.js
module.exports = {
  debugVSCode: true,
};
```

## Release Notes

_No release notes while < v1.0.0_

## Support Five Server

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-%E2%9D%A4-lightgrey?style=social&logo=GitHub)](https://github.com/sponsors/yandeu)  
[![One-Time Donation](https://img.shields.io/badge/One--Time%20Donation-$1-lightgrey?style=social&logo=GitHub)](https://github.com/sponsors/yandeu?frequency=one-time&sponsor=yandeu#sponsors:~:text=%241%20one%20time)

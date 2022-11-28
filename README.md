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
    <img alt="VERSION" src="https://img.shields.io/visual-studio-marketplace/v/yandeu.five-server.svg?color=228cb3&amp;label="/>
    <img alt="Visual Studio Marketplace Rating" src="https://img.shields.io/visual-studio-marketplace/r/yandeu.five-server?color=228cb3">
  </a>
  <a href="https://github.com/sponsors/yandeu" target="__blank">
    <img alt="GitHub Sponsors" src="https://img.shields.io/github/sponsors/yandeu?color=228cb3">
  </a>
</p>

- ⚡️ **Updates your files instantly** while typing on your keyboard
- ⬢ Remote displays the logs of your browser/phone in your terminal
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
2. Right-Click a Open File > **Open with Five Server**
3. Right-Click a File in the Explorer > **Open with Five Server**
4. Right-Click a Folder in the Explorer > **Open with Five Server (root)**  
   _(will set the current folder as root until you stop the server)_

## Videos

- [Instant Update](https://youtu.be/3-zKYNrxKOk)
- [Instant Update (with PHP)](https://youtu.be/4s7q5chX-e0)
- [New Highlight Styles](https://youtu.be/zlKxvw-vy_M)

## Quick Test

Something is not working? Try the simple setup below:

- make sure you have uninstalled the old **Live Server**
- check if you have the latest version  
  [![VERSION](https://img.shields.io/visual-studio-marketplace/v/yandeu.five-server.svg?color=228cb3&label=)](https://marketplace.visualstudio.com/items?itemName=yandeu.five-server)
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
- Or maybe on a USB Stick or remote folder like `OneDrive` or `DropBox`?
- Make sure you open a folder in VSCode and NOT just a single file.
- All these things can sometimes cause issues.

## About PHP

Although Five Server can render, display and live reload PHP, it does not provide a full PHP server. If you want to develop a big PHP app, you manually have to link the client-side Five Server script with your PHP files. See [five-server-with-php](https://github.com/yandeu/five-server-with-php).

## Features

💡 Most **advanced features** are disabled by default.  
Turn them on in the settings or by configuring a `fiveserver.config.js` file in the root of your workspace.

Note:

- **Instant Update** & **Highlight** works with `.html` and `.php` files.
- All remote logs will be visible in a new Terminal called "Five Server".
- The features `highlight`, `injectBody` and `remoteLogs` are disable by default.
- To use the `highlight` feature, `injectBody` has to be activated.
- `injectBody` performs some simple HTML Validation. When using `injectBody`, a message will be displayed if your HTML Page is invalid.
- To temporarily disable `highlight` for a single HTML Tag, add a **H**.  
  Example: `<div H>Don't highlight me</div>`

Config File Example:

```js
// fiveserver.config.js
module.exports = {
  highlight: true, // enable highlight feature
  injectBody: true, // enable instant update
  remoteLogs: true, // enable remoteLogs
  remoteLogs: "yellow", // enable remoteLogs and use the color yellow
  injectCss: false, // disable injecting css
  navigate: true, // enable auto-navigation
};
```

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

Need to debug something? Set `debugVSCode` to true.

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

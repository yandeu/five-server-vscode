# Five Server

VSCode Extension for [Five Server](https://github.com/yandeu/five-server#readme).

Development Server with **Live Reload** Capability.  
(Maintained **F**ork of **Live Server**)

- Rewritten in TypeScript
- Up-to-date dependencies
- Better than ever!

## Top Features

- 🚀 **Remote Logs**  
  Displays the logs of your browser in your terminal!  
  _Useful when debugging on your smartphone for example._  
  _Disabled by default._

- 🚀 **Instant Updates**  
  Updates your html page while typing!  
  _Disabled by default._

- 🚀 **Highlights**  
  Highlights the code you are working on in your browser!  
  _Will be improved in the next weeks._  
  _Disabled by default._

- 🚀 **Auto Navigation**  
  Navigates your browser automatically to the current editing .html file!  
  _Enabled by default._

- 🚀 **PHP Server**  
  Serves not only your `.html` files but also `.php`.  
  _See docs below._

- 🚀 **Server Side Rendered App**  
  Works with any Server Side Rendered content like **Express.js**!  
  _See docs below._

## Preview

[![preview](https://raw.githubusercontent.com/yandeu/five-server/main/img/vscode-preview.gif)](https://youtu.be/aETkOu8J-bo)

## Get Started

3 ways to start your live server.

1. Click **Go Live** in the Status Bar (bottom of VSCode)
2. Right-Click on an open `.html` file > **Open with Five Server**
3. Right-Click an `.html` file in the Sidebar > **Open with Five Server**

## Documentation

### Remote Logs

All remote logs will be visible in a new Terminal called "Five Server".

### Config File

```js
// fiveserver.config.js
module.exports = {
  highlight: true, // enable highlight feature
  injectBody: true, // enable instant update
  navigate: false, // disable auto-navigation
  remoteLogs: true | "yellow", // enable remoteLogs or choose a different color
};
```

- Check all available options for the config file in [`/src/types.ts`](https://github.com/yandeu/five-server/blob/main/src/types.ts).
- Check all available colors for the `remoteLogs` in [`/src/colors.ts`](https://github.com/yandeu/five-server/blob/main/src/colors.ts).

### More Docs

- Read [Five Server - Documentation](https://github.com/yandeu/five-server#documentation).
- Read [Five Server - Config File](https://github.com/yandeu/five-server#config-file).

## Issues

Five Server is still in development. Issues you have now, will probably be resolved soon.

### Quick Test

Something is not working?  
Try the simple setup below:

- make sure you have uninstalled the old **Live Server**
- check if you have the latest version ![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/yandeu.five-server?label=VSCode&style=flat-square)
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

### Debug Mode

Set `debugVSCode` to true;

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

import { build } from "esbuild";
import { cp } from "fs/promises";

// "esbuild ./src/extension.ts --bundle --outfile=out/main.js --external:vscode --format=cjs --platform=node",
await cp("./node_modules/five-server/public", "./dist/bundle/public", { recursive: true });
await cp("./node_modules/five-server/client", "./dist/bundle/client", { recursive: true });

await build({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/bundle/subdir/main.js",
  external: ["vscode", "@yandeu/open-cjs", "fsevents"],
  format: "cjs",
  platform: "node",
  minify: true,
});

await build({
  entryPoints: ["node_modules/five-server/lib/workers/parseBody.js"],
  bundle: true,
  outfile: "dist/bundle/subdir/parseBody.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  minify: true,
});

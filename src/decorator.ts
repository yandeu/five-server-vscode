/**
 * @copyright   Copyright (c) 2017 Wix.com
 * @license     {@link https://github.com/wix/import-cost/blob/master/LICENSE MIT}
 * @description copied and modified from (https://github.com/wix/import-cost/blob/master/packages/vscode-import-cost/src/decorator.ts)
 */

import { DecorationRenderOptions, Position, Range, window } from "vscode";
import { strToHash } from "./helpers";

let decorations: {
  [fileHash: string]: {
    renderOptions: DecorationRenderOptions;
    range: Range;
  }[];
} = {};

let decorationsDebounce: any;
let prevDecs = "empty";

/** Add/Replace all decorations "fileName". */
export const decorate = (
  fileName: string,
  props: {
    text: string;
    line: number;
  }[],
  color: string
) => {
  const hash = strToHash(fileName);

  // remove all decorations for "fileName"
  decorations[hash] = [];

  props.forEach((p) => {
    const { text, line } = p;

    decorations[hash].push({
      renderOptions: { after: { contentText: text, color } },
      range: new Range(
        new Position(line - 1, 1024),
        new Position(line - 1, 1024)
      ),
    });
  });

  refreshDecorations(fileName);
};

const decorationType = window.createTextEditorDecorationType({
  after: { margin: "0 0 0 1rem" },
});

export const refreshDecorations = (
  fileName: string | undefined,
  options: { delay?: number; force?: boolean } = {}
) => {
  if (!fileName) return;

  const { delay = 250, force = false } = options;

  const hash = strToHash(fileName);

  if (!force && prevDecs === JSON.stringify(decorations)) return;
  prevDecs = JSON.stringify(decorations);

  clearTimeout(decorationsDebounce);

  decorationsDebounce = setTimeout(() => {
    getEditors(fileName).forEach((editor) => {
      editor.setDecorations(decorationType, decorations[hash] || []);
    });
  }, delay);
};

const getEditors = (fileName: string) => {
  return window.visibleTextEditors.filter(
    (editor) => editor.document.fileName === fileName
  );
};

export const clearDecorations = () => {
  window.visibleTextEditors.forEach((textEditor) => {
    decorations = {};
    return textEditor.setDecorations(decorationType, []);
  });
};

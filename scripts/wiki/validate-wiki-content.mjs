import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { JSDOM } from 'jsdom';

import {
  formatWikiContentReport,
  validateWikiContent,
  wikiContentExitCode,
} from './wiki-content-contract.mjs';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.SVGElement = dom.window.SVGElement;

const { default: mermaid } = await import('mermaid');
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  suppressErrorRendering: true,
});

const repoRoot = process.cwd();
const scriptPath = fileURLToPath(import.meta.url);
const isDirectRun = path.resolve(process.argv[1] || '') === scriptPath;

if (isDirectRun) {
  const report = await validateWikiContent({
    repoRoot,
    expectedSourceCount: 227,
    parseMermaid: (diagram) => mermaid.parse(diagram, { suppressErrors: false }),
  });
  const output = formatWikiContentReport(report);
  (report.errors.length === 0 ? console.log : console.error)(output);
  process.exitCode = wikiContentExitCode(report);
}

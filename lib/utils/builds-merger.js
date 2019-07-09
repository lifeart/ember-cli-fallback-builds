/* eslint-env node */

const { Builder } = require("broccoli");
const Merge = require("broccoli-merge-trees");
const path = require("path");
const Funnel = require("broccoli-funnel");
const { rename } = require("broccoli-stew");

function buildsMerger({ outputPath }) {
  const legacyTree = path.join(outputPath, "legacy");
  const modernTree = path.join(outputPath, "modern");

  const legacyNonJsFiles = new Funnel(legacyTree, {
    exclude: ["**/*.js", "**/index.html"]
  });

  const legacyIndexHtml = new Funnel(legacyTree, {
    include: ["**/index.html"]
  });
  const legacyJs = new Funnel(legacyTree, {
    include: ["**/*.js"]
  });
  const renamedLagacyJs = rename(legacyJs, ".js", ".fb.js");
  const renamedLagacyHtml = rename(legacyIndexHtml, ".html", ".fb.html");

  const modernNonJsFiles = new Funnel(modernTree, {
    exclude: ["**/*.js", "**/index.html"]
  });

  const modernIndexHtml = new Funnel(modernTree, {
    include: ["**/index.html"]
  });

  const modernJs = new Funnel(modernTree, {
    include: ["**/*.js"]
  });

  const tree = new Merge(
    [
      legacyNonJsFiles,
      modernNonJsFiles,
      renamedLagacyJs,
      modernIndexHtml,
      modernJs,
      renamedLagacyHtml
    ],
    { overwrite: true }
  );
  const builder = new Builder(tree);
  return builder;
}

module.exports = buildsMerger;

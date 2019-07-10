/* eslint-env node */
"use strict";

const chalk = require("chalk");
const Task = require("ember-cli/lib/models/task");
const path = require("path");
const fs = require("fs");
const rimraf = require("rimraf");
const { extractFallbackScripts, patchIndexFile } = require("../utils/html-ast");
const createDummyBuilder = require("../utils/dummy-builder");
const buildsMerger = require("../utils/builds-merger");
const TARGET_LEGACY = "LEGACY";
const TARGET_MODERN = "MODERN";
const TreeSync = require("tree-sync");
const spawn = require("child_process").spawnSync;
//
// A task that builds out the Ember app shimmed to run in electron,
// optionally assembles the app into an electron forge-compatible project, and
// optionally symlinks node_modules to the project's node_modules.
//

function dropUnusedFiles(entry) {
  fs.unlinkSync(path.join(entry, "index.fb.html"));
}

function cleanupOutputPath(entry) {
  rimraf.sync(entry);
}

function syncIndex(entry) {
  // return '2eqdsadsda');
  const fallbackScripts = extractFallbackScripts(entry);
  patchIndexFile(entry, fallbackScripts);
}

class BuildTask extends Task {
  // platform is only used when assembling
  run({ outputPath, environment }) {
    let { ui } = this;
    let progressMessage;
    let successMessage;

    progressMessage = "Building";
    successMessage = "Built";

    ui.startProgress(chalk.green(progressMessage), chalk.green("."));
    const dummyBuilder = createDummyBuilder();

    const legacyOutputPath = path.join(dummyBuilder.outputPath, "legacy");
    const relativeLegacyOutput = path.relative(
      this.project.root,
      legacyOutputPath
    );
    const modernOutputPath = path.join(dummyBuilder.outputPath, "modern");
    const relativeModernOutput = path.relative(
      this.project.root,
      modernOutputPath
    );
    // eslint-disable-next-line
    let legacyEnv = Object.assign(JSON.parse(JSON.stringify(process.env)), {
      EMBER_FALLBACK_OUTPUT_PATH: relativeLegacyOutput,
      EMBER_FALLBACK_ENVIRONMENT: environment,
      BUILD_TARGET: TARGET_LEGACY
    });
    let modernEnv = Object.assign(JSON.parse(JSON.stringify(process.env)), {
      EMBER_FALLBACK_OUTPUT_PATH: relativeModernOutput,
      EMBER_FALLBACK_ENVIRONMENT: environment,
      BUILD_TARGET: TARGET_MODERN
    });

    spawn(`ember`, ["build:fallback-programmatic"], {
      env: legacyEnv,
      cwd: this.project.root,
      encoding: "utf8",
      shell: true
    });

    spawn(`ember`, ["build:fallback-programmatic"], {
      env: modernEnv,
      cwd: this.project.root,
      encoding: "utf8",
      shell: true
    });

    const bd = buildsMerger({
      outputPath: dummyBuilder.outputPath
    });

    // gonna merge basic builds output
    return bd.build().then(() => {
      // let's rewrite index.html
      syncIndex(bd.outputPath);
      // let's remove legacy index.html
      dropUnusedFiles(bd.outputPath);

      cleanupOutputPath(outputPath);
      // rimraf.sync(outputPath);

      const outputTree = new TreeSync(bd.outputPath, path.join(outputPath));
      // let's move our build into expected location
      outputTree.sync();
      ui.stopProgress();
      ui.writeLine(
        chalk.green(
          `${successMessage} multibuild project successfully. Stored in "${outputPath}".`
        )
      );
      return dummyBuilder.cleanup().then(() => {
        return bd.cleanup();
      });
    });
  }
}

module.exports = BuildTask;

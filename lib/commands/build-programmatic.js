/* eslint-env node */
'use strict';

const BuildCommand = require("ember-cli/lib/commands/build");
const Win = require('ember-cli/lib/utilities/windows-admin');

module.exports = BuildCommand.extend({
  name: 'build:fallback-programmatic',
  description: 'Builds your app and places it into the output path (dist/ by default).',

  // eslint-disable-next-line
  availableOptions: [
    { name: 'environment',    type: String,  default: process.env.EMBER_FALLBACK_ENVIRONMENT},
    { name: 'output-path',    type: 'Path',  default: process.env.EMBER_FALLBACK_OUTPUT_PATH },
    // { name: 'watch',          type: Boolean, default: false,         aliases: ['w'] },
    // { name: 'watcher',        type: String },
    { name: 'suppress-sizes', type: Boolean, default: true },
  ],

  run(commandOptions) {
    return Win.checkIfSymlinksNeedToBeEnabled(this.ui)
      .then(() => {
        let buildTaskName = commandOptions.watch ? 'BuildWatch' : 'Build';
        return this.runTask(buildTaskName, commandOptions);
      })
  },

});

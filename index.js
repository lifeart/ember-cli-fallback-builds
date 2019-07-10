'use strict';

module.exports = {
  name: require('./package').name,
  includedCommands() {
    return {
      'build:fallback': require('./lib/commands/build-fallback'),
      'build:fallback-programmatic': require('./lib/commands/build-programmatic')
    };
  },
};

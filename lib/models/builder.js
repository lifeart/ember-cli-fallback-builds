'use strict';

const BaseBuilder = require('ember-cli/lib/models/builder');
const path = require('path');
const fs = require('fs');

function requireUncached(module){
  delete require.cache[require.resolve(module)]
  return require(module);
}

function targetsFor(project) {
  const maybeTargetsPath = path.join(project.root, 'config/targets');
  if (!fs.existsSync(maybeTargetsPath + '.js')) {
    return project.targets;
  }
  const targets = requireUncached(maybeTargetsPath);
  if (typeof targets === 'object' && targets !== null) {
    return targets;
  } else {
    return project.targets;
  }
}


class Builder extends BaseBuilder {
  constructor(options) {
    // platform is only used when assembling
    let { buildTarget, project } = options;
    process.env.BUILD_TARGET = buildTarget;

    Object.assign(project, {
      _targets: targetsFor(project)
    })

    super(...arguments);
  }
}

module.exports = Builder;

'use strict';

const BaseBuilder = require('ember-cli/lib/models/builder');

class Builder extends BaseBuilder {
  constructor(options) {
    // platform is only used when assembling
    let { buildTarget } = options;
    process.env.BUILD_TARGET = buildTarget;
    super(...arguments);
  }
}

module.exports = Builder;

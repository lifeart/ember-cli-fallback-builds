/* eslint-env node */

const tmp = require("tmp");
function createDummyBuilder() {
  const tmpobj = tmp.dirSync();
  tmpobj.removeCallback();
  tmpobj.outputPath = tmpobj.name;
  tmpobj.cleanup = function() {
    return new Promise(resolve => {
      tmpobj.removeCallback();
      resolve();
    });
  };
  return tmpobj;
}

module.exports = createDummyBuilder;

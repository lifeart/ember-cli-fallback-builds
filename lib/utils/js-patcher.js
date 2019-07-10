/* eslint-env node */
const fs = require("fs");

const integrityStringForText = require("./crypto");

function patchVendorNode(fileName) {
  const result = fs.readFileSync(fileName, { encoding: "utf8" });

  const append = `
    
    ;window.mainContext = window;

    (function(){  
    `;

  // let result = text
  //   .split("=this.Ember=this.Ember")
  //   .join("=window.Ember=window.Ember");

  // // unminified case
  // result = result
  //   .split(" = this.Ember = this.Ember")
  //   .join(" = window.Ember = window.Ember");

  const prepend = `
    ;

    window.define = define;
    window.require = require;
    if (typeof runningTests !== undefined) {
      window.runningTests = runningTests;
    }
    if (typeof __ember_auto_import__ !== undefined) {
      window.__ember_auto_import__ = __ember_auto_import__;
    }
    
  }).call(window);
    `;

  const data = append.trim() + result + prepend.trim();

  fs.writeFileSync(fileName, data);

  return integrityStringForText(data);
}

module.exports.patchVendorNode = patchVendorNode;

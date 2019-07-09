/* eslint-env node */

const fs = require("fs");

const integrityStringForText = require("./crypto");

function patchVendorNode(fileName) {
  const text = fs.readFileSync(fileName, { encoding: "utf8" });

  const append = `
    ;window.mainContext = window;
    `;

  let result = text
    .split("=this.Ember=this.Ember")
    .join("=window.Ember=window.Ember");

  // unminified case
  result = result
    .split(" = this.Ember = this.Ember")
    .join(" = window.Ember = window.Ember");

  const prepend = `
    ;
    window.define = define;
    window.runningTests = runningTests;
    window.require = require;
    `;

  const data = append.trim() + result + prepend.trim();

  fs.writeFileSync(fileName, data);

  return integrityStringForText(data);
}

module.exports.patchVendorNode = patchVendorNode;

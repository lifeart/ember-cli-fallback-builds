/* eslint-env node */
const parse5 = require("parse5");
const fs = require("fs");
const path = require("path");
const { patchVendorNode } = require("./js-patcher");
const prettyHTML = require("js-beautify").html;

function findNodes(parentNode, tagName) {
  return parentNode.childNodes.filter(node => node.tagName === tagName);
}
function hasAttr(node, attrName) {
  const attrs = node.attrs.filter(attr => attr.name === attrName);
  if (attrs.length) {
    return attrs[0];
  } else {
    return false;
  }
}

function findNode(parentNode, tagName) {
  let items = findNodes(parentNode, tagName);
  if (items.length) {
    return items[0];
  } else {
    return null;
  }
}

function extractFallbackScripts(entry) {
  const legacyIndex = fs.readFileSync(path.join(entry, "index.fb.html"), {
    encoding: "utf8"
  });
  const document = parse5.parse(legacyIndex);

  const scripts = [];
  const htmlNode = findNode(document, "html");
  const bodyNode = findNode(htmlNode, "body");
  const scriptNodes = findNodes(bodyNode, "script");
  scriptNodes.forEach(n => {
    const maybeSrc = hasAttr(n, "src");
    if (!maybeSrc) {
      return;
    }
    const newFileName = maybeSrc.value.replace(".js", ".fb.js");
    if (fs.existsSync(path.join(entry, newFileName))) {
      maybeSrc.value = newFileName;

      if (hasAttr(n, "nomodule")) {
        fs.unlinkSync(path.join(entry, newFileName));
        return;
      }

      n.attrs.push({
        name: "nomodule",
        value: ""
      });
      scripts.push(n);
    }
  });
  return scripts;
}

function patchIndexFile(entry, fallbackScripts) {
  const index = fs.readFileSync(path.join(entry, "index.html"), {
    encoding: "utf8"
  });
  const document = parse5.parse(index);
  const htmlNode = findNode(document, "html");
  const bodyNode = findNode(htmlNode, "body");
  const scriptNodes = findNodes(bodyNode, "script");
  let lastScriptNodeIndex = 0;
  scriptNodes.forEach(n => {
    if (hasAttr(n, "type") || hasAttr(n, "nomodule")) {
      return;
    }
    const maybeSrc = hasAttr(n, "src");
    if (!maybeSrc) {
      return;
    }
    let newIntegrity = null;

    if (
      maybeSrc.value.includes("/vendor-") ||
      maybeSrc.value.endsWith("/vendor.js")
    ) {
      newIntegrity = patchVendorNode(path.join(entry, maybeSrc.value));
    }

    if (newIntegrity) {
      const maybeIntegrity = hasAttr(n, "integrity");
      if (maybeIntegrity) {
        maybeIntegrity.value = newIntegrity;
      }
    }

    n.attrs.push({
      name: "type",
      value: "module"
    });

    lastScriptNodeIndex = bodyNode.childNodes.indexOf(n);
  });

  bodyNode.childNodes.splice(lastScriptNodeIndex + 1, 0, ...fallbackScripts);

  const html = parse5.serialize(document);
  const fixedHtml = html.split('nomodule=""').join("nomodule");

  //
  fs.writeFileSync(path.join(entry, "index.html"), prettyHTML(fixedHtml));
}

module.exports.extractFallbackScripts = extractFallbackScripts;
module.exports.patchIndexFile = patchIndexFile;

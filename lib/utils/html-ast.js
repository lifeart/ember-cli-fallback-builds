const parse5 = require("parse5");
const fs = require("fs");
const path = require("path");
const { patchVendorNode } = require("./js-patcher");
const prettyHTML = require("js-beautify").html;

function extractFallbackScripts(entry) {
  const legacyIndex = fs.readFileSync(path.join(entry, "index.fb.html"), {
    encoding: "utf8"
  });
  const document = parse5.parse(legacyIndex);

  const scripts = [];
  document.childNodes.forEach(node => {
    if (node.tagName === "html") {
      node.childNodes.forEach(nod => {
        if (nod.tagName === "body") {
          nod.childNodes.forEach(n => {
            if (n.tagName === "script") {
              n.attrs.forEach(attr => {
                if (attr.name === "src") {
                  attr.value = attr.value.replace(".js", ".fb.js");
                }
              });
              n.attrs.push({
                name: "nomodule",
                value: ""
              });
              scripts.push(n);
            }
          });
        }
      });
    }
  });

  return scripts;
}

function patchIndexFile(entry, fallbackScripts) {
  const index = fs.readFileSync(path.join(entry, "index.html"), {
    encoding: "utf8"
  });
  const document = parse5.parse(index);

  document.childNodes.forEach(nod => {
    if (nod.tagName === "html") {
      nod.childNodes.forEach(node => {
        if (node.tagName === "body") {
          node.childNodes.forEach(n => {
            if (n.tagName === "script") {
              let newIntegrity = null;
              n.attrs.forEach(attr => {
                if (attr.name === "src") {
                  if (
                    attr.value.includes("/vendor-") ||
                    attr.value.endsWith("/vendor.js")
                  ) {
                    newIntegrity = patchVendorNode(
                      path.join(entry, attr.value)
                    );
                  }
                }
              });
              if (newIntegrity) {
                n.attrs.forEach(attr => {
                  if (attr.name === "integrity") {
                    attr.value = newIntegrity;
                  }
                });
              }
              n.attrs.push({
                name: "type",
                value: "module"
              });
            }
          });
          fallbackScripts.forEach(scr => {
            node.childNodes.push(scr);
          });
        }
      });
    }
  });

  const html = parse5.serialize(document);
  const fixedHtml = html.split('nomodule=""').join("nomodule");

  //
  fs.writeFileSync(path.join(entry, "index.html"), prettyHTML(fixedHtml));
}

module.exports.extractFallbackScripts = extractFallbackScripts;
module.exports.patchIndexFile = patchIndexFile;

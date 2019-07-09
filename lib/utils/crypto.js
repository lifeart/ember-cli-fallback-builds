/* eslint-env node */

var crypto = require("crypto");

function integrityStringForText(text) {
  const hash_sha256 = crypto.createHash("sha256");
  const hash_sha512 = crypto.createHash("sha512");

  hash_sha256.update(text);
  hash_sha512.update(text);
  const integrityString = `sha256-${hash_sha256.digest(
    "base64"
  )} sha512-${hash_sha512.digest("base64")}`;
  return integrityString;
}

module.exports = integrityStringForText;

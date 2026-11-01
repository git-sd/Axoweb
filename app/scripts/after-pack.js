// electron-builder leaves out node_modules and dot-folders (.next) when it copies extra
// resources, and the scanner's server needs both. So copy the bundle in ourselves, after the
// app is packed and before it is zipped or put in an installer.
const { cpSync } = require("node:fs");
const path = require("node:path");

exports.default = async function afterPack(context) {
  cpSync(path.join(__dirname, "..", "server-bundle"), path.join(context.appOutDir, "resources", "server"), { recursive: true });
};

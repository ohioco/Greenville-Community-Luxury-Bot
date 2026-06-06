const fs = require("fs");

function read(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file));
}

function write(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = { read, write };

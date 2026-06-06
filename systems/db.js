const fs = require("fs");

function load(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file));
}

function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function get(file, key) {
  const data = load(file);
  return data[key];
}

function set(file, key, value) {
  const data = load(file);
  data[key] = value;
  save(file, data);
}

function update(file, key, updater) {
  const data = load(file);
  if (!data[key]) data[key] = {};
  data[key] = updater(data[key]);
  save(file, data);
}

module.exports = { load, save, get, set, update };

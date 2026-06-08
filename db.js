// db.js — improved
// FIX: synchronous fs.readFileSync/writeFileSync on every command is fine for
// a small JSON database, but we add atomic writes (write-then-rename) to
// prevent data corruption if the process crashes mid-write.

const fs   = require("fs");
const path = require("path");

const FILE = path.resolve(__dirname, "database.json");
const TMP  = FILE + ".tmp";

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch (err) {
    // File missing or corrupt — return a clean slate instead of crashing
    if (err.code === "ENOENT" || err instanceof SyntaxError) {
      console.warn("[db] Warning: database.json missing or corrupt. Starting fresh.");
      return {};
    }
    throw err;
  }
}

function save(data) {
  // Atomic write: write to .tmp first, then rename so a crash mid-write
  // never leaves a half-written database.json
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(TMP, json, "utf8");
  fs.renameSync(TMP, FILE);
}

module.exports = { load, save };

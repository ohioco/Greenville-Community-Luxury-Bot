// In-memory store for session links (avoids Discord 100-char customId limit)
const store = {};

let counter = 0;

function saveLink(link) {
  const key = `lnk_${++counter}`;
  store[key] = link;
  return key;
}

function getLink(key) {
  return store[key] || null;
}

module.exports = { saveLink, getLink };

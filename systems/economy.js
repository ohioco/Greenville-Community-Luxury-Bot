const db = require("./db");

const file = "./database/users.json";

function getUser(id) {
  let data = db.read(file);
  if (!data[id]) data[id] = { balance: 0 };
  db.write(file, data);
  return data[id];
}

function addMoney(id, amount) {
  let data = db.read(file);
  if (!data[id]) data[id] = { balance: 0 };
  data[id].balance += amount;
  db.write(file, data);
}

module.exports = { getUser, addMoney };

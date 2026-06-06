const db = require("./db");

const ticketsFile = "./database/tickets.json";
const warrantsFile = "./database/warrants.json";

function createTicket(id, user, reason, amount) {
  let data = db.read(ticketsFile);

  data[id] = { user, reason, amount, status: "unpaid" };

  db.write(ticketsFile, data);
  return "Ticket issued";
}

function createWarrant(id, user, reason) {
  let data = db.read(warrantsFile);

  data[id] = { user, reason, status: "active" };

  db.write(warrantsFile, data);
  return "Warrant issued";
}

module.exports = { createTicket, createWarrant };

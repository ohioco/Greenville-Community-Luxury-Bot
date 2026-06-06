const eco = require("./economy");
const db = require("./db");

const vehiclesFile = "./database/vehicles.json";

function getProfile(userId) {
  const user = eco.getUser(userId);
  const vehicles = db.read(vehiclesFile);

  const userVehicles = Object.entries(vehicles)
    .filter(([_, v]) => v.owner === userId)
    .map(([id, v]) => ({ id, ...v }));

  return {
    balance: user.balance,
    vehicles: userVehicles
  };
}

module.exports = { getProfile };

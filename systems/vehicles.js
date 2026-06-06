const db = require("./db");

const file = "./database/vehicles.json";

function registerVehicle(id, owner, brand, model, year, color) {
  let data = db.read(file);

  data[id] = {
    owner,
    brand,
    model,
    year,
    color,
    plateId: null
  };

  db.write(file, data);
  return "Vehicle registered";
}

function getVehicle(id) {
  let data = db.read(file);
  return data[id];
}

module.exports = { registerVehicle, getVehicle };

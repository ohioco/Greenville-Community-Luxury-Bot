const db = require("./db");

const platesFile = "./database/plates.json";
const vehiclesFile = "./database/vehicles.json";

function createPlate(id, number, state) {
  let plates = db.read(platesFile);

  plates[id] = {
    number,
    state,
    assignedVehicle: null,
    status: "active"
  };

  db.write(platesFile, plates);
  return "Plate created";
}

function assignPlate(plateId, vehicleId) {
  let plates = db.read(platesFile);
  let vehicles = db.read(vehiclesFile);

  if (!plates[plateId] || !vehicles[vehicleId])
    return "Invalid plate or vehicle";

  // remove old assignment
  if (plates[plateId].assignedVehicle) {
    vehicles[plates[plateId].assignedVehicle].plateId = null;
  }

  plates[plateId].assignedVehicle = vehicleId;
  vehicles[vehicleId].plateId = plateId;

  db.write(platesFile, plates);
  db.write(vehiclesFile, vehicles);

  return "Plate assigned";
}

function unassignPlate(plateId) {
  let plates = db.read(platesFile);
  let vehicles = db.read(vehiclesFile);

  if (!plates[plateId]) return "Plate not found";

  let veh = plates[plateId].assignedVehicle;
  if (veh && vehicles[veh]) vehicles[veh].plateId = null;

  plates[plateId].assignedVehicle = null;

  db.write(platesFile, plates);
  db.write(vehiclesFile, vehicles);

  return "Plate unassigned";
}

function plateInfo(id) {
  let plates = db.read(platesFile);
  let vehicles = db.read(vehiclesFile);

  let p = plates[id];
  if (!p) return null;

  return {
    ...p,
    vehicle: p.assignedVehicle ? vehicles[p.assignedVehicle] : null
  };
}

module.exports = { createPlate, assignPlate, unassignPlate, plateInfo };

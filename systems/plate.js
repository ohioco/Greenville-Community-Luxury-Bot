const db = require("./db");

const platesFile = "./database/plates.json";
const vehiclesFile = "./database/vehicles.json";

// CREATE PLATE
function createPlate(id, number, state) {
  const plates = db.load(platesFile);

  plates[id] = {
    number,
    state,
    assignedVehicle: null,
    status: "active"
  };

  db.save(platesFile, plates);
  return "🪪 Plate created";
}

// ASSIGN PLATE (SAFE REASSIGN)
function assignPlate(plateId, vehicleId) {
  const plates = db.load(platesFile);
  const vehicles = db.load(vehiclesFile);

  if (!plates[plateId] || !vehicles[vehicleId]) {
    return "❌ Invalid plate or vehicle";
  }

  // remove old link if exists
  if (plates[plateId].assignedVehicle) {
    const oldVeh = plates[plateId].assignedVehicle;
    if (vehicles[oldVeh]) {
      vehicles[oldVeh].plateId = null;
    }
  }

  // assign new
  plates[plateId].assignedVehicle = vehicleId;
  vehicles[vehicleId].plateId = plateId;

  db.save(platesFile, plates);
  db.save(vehiclesFile, vehicles);

  return "🔗 Plate assigned successfully";
}

// UNASSIGN
function unassignPlate(plateId) {
  const plates = db.load(platesFile);
  const vehicles = db.load(vehiclesFile);

  if (!plates[plateId]) return "❌ Plate not found";

  const veh = plates[plateId].assignedVehicle;

  if (veh && vehicles[veh]) {
    vehicles[veh].plateId = null;
  }

  plates[plateId].assignedVehicle = null;

  db.save(platesFile, plates);
  db.save(vehiclesFile, vehicles);

  return "❌ Plate unassigned";
}

// INFO
function plateInfo(id) {
  const plates = db.load(platesFile);
  const vehicles = db.load(vehiclesFile);

  const plate = plates[id];
  if (!plate) return null;

  return {
    ...plate,
    vehicle: plate.assignedVehicle ? vehicles[plate.assignedVehicle] : null
  };
}

module.exports = {
  createPlate,
  assignPlate,
  unassignPlate,
  plateInfo
};

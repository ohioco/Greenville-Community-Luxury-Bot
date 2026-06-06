require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");

const eco = require("./systems/economy");
const vehicle = require("./systems/vehicle");
const plate = require("./systems/plate");
const profile = require("./systems/profile");
const legal = require("./systems/legal");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("ready", () => {
  console.log("RP Bot Online");
});

client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;

  const args = msg.content.split(" ");
  const cmd = args[0];

  // 💰 BALANCE
  if (cmd === "!balance") {
    const user = eco.getUser(msg.author.id);
    msg.reply(`💰 $${user.balance}`);
  }

  // 💵 DAILY WORK
  if (cmd === "!work") {
    eco.addMoney(msg.author.id, 500);
    msg.reply("💵 +$500 added");
  }

  // 🚗 VEHICLE
  if (cmd === "!register_vehicle") {
    msg.reply(vehicle.registerVehicle(
      args[1], msg.author.id, args[2], args[3], args[4], args[5]
    ));
  }

  // 🪪 PLATE
  if (cmd === "!create_plate") {
    msg.reply(plate.createPlate(args[1], args[2], args[3]));
  }

  if (cmd === "!assign_plate") {
    msg.reply(plate.assignPlate(args[1], args[2]));
  }

  if (cmd === "!unassign_plate") {
    msg.reply(plate.unassignPlate(args[1]));
  }

  if (cmd === "!plate_info") {
    msg.reply("```json\n" + JSON.stringify(plate.plateInfo(args[1]), null, 2) + "\n```");
  }

  // 👤 PROFILE
  if (cmd === "!profile") {
    const p = profile.getProfile(msg.author.id);
    msg.reply("```json\n" + JSON.stringify(p, null, 2) + "\n```");
  }

  // 🚨 TICKET
  if (cmd === "!ticket") {
    msg.reply(legal.createTicket(
      args[1], args[2], args[3], args[4]
    ));
  }

  // 🚨 WARRANT
  if (cmd === "!warrant") {
    msg.reply(legal.createWarrant(
      args[1], args[2], args[3]
    ));
  }
});

client.login(process.env.TOKEN);

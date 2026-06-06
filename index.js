const { Client, GatewayIntentBits } = require("discord.js");

const plateSystem = require("./systems/plateSystem");
const vehicleSystem = require("./systems/vehicleSystem");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("ready", () => {
  console.log(`RP Bot online as ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");

  // CREATE PLATE
  if (args[0] === "!create_plate") {
    const result = plateSystem.createPlate(args[1], args[2], args[3]);
    message.reply(result);
  }

  // ASSIGN PLATE
  if (args[0] === "!assign_plate") {
    const result = plateSystem.assignPlate(args[1], args[2]);
    message.reply(result);
  }

  // UNASSIGN PLATE
  if (args[0] === "!unassign_plate") {
    const result = plateSystem.unassignPlate(args[1]);
    message.reply(result);
  }

  // PLATE INFO
  if (args[0] === "!plate_info") {
    const info = plateSystem.getPlateInfo(args[1]);
    message.reply("```json\n" + JSON.stringify(info, null, 2) + "\n```");
  }

  // REGISTER VEHICLE
  if (args[0] === "!register_vehicle") {
    const result = vehicleSystem.registerVehicle(
      args[1], args[2], args[3], args[4], args[5], args[6]
    );
    message.reply(result);
  }
});

client.login(process.env.TOKEN);

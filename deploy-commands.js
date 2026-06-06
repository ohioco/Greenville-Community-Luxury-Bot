require("dotenv").config();
const { REST, Routes } = require("discord.js");

const commands = [
  require("./commands/startup").data.toJSON(),
  require("./commands/vehicle").data.toJSON(),
  require("./commands/plate").data.toJSON(),
  require("./commands/profile").data.toJSON()
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, "YOUR_SERVER_ID"),
    { body: commands }
  );

  console.log("Commands deployed");
})();

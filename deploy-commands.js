require("dotenv").config();
const { REST, Routes } = require("discord.js");

const commands = [
  {
    name: "startup",
    description: "Start RP session embed"
  },
  {
    name: "work",
    description: "Earn daily RP money"
  }
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Deploying slash commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("Slash commands deployed!");
  } catch (err) {
    console.error(err);
  }
})();

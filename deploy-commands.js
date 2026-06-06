const fs = require("fs");
const { REST, Routes } = require("discord.js");

const commands = [];

const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const cmd = require(`./commands/${file}`);

  if (!cmd.data || !cmd.data.toJSON) {
    console.log(`❌ Skipping broken command: ${file}`);
    continue;
  }

  commands.push(cmd.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Deploying commands...");

    await rest.put(
  Routes.applicationGuildCommands(
    process.env.CLIENT_ID,
    "1512780159655084112" // your real server ID here
  ),
  { body: commands }
);

    console.log("Done!");
  } catch (err) {
    console.error(err);
  }
})();

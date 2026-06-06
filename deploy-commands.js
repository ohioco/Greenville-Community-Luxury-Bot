const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");

require("dotenv").config();

const commands = [];

const files = fs.readdirSync(path.join(__dirname, "commands"))
  .filter(f => f.endsWith(".js"));

for (const file of files) {
  try {
    console.log("Loading:", file);

    const cmd = require(`./commands/${file}`);

    if (!cmd || !cmd.data || !cmd.data.toJSON) {
      console.log("❌ SKIPPED INVALID:", file);
      continue;
    }

    const json = cmd.data.toJSON();

    if (!json.name || !json.description) {
      console.log("❌ BAD COMMAND DATA:", file, json);
      continue;
    }

    commands.push(json);

  } catch (err) {
    console.log("❌ CRASH FILE:", file);
    console.log(err);
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Deploying commands...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("✅ Done deploying:", commands.length);
  } catch (err) {
    console.error(err);
  }
})();

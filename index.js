require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log(`🚔 Greenville Community Luxury Online`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // /startup
  if (interaction.commandName === "startup") {
    await interaction.reply({
      embeds: [
        {
          title: "Greenville Community Luxury ™",
          description:
`> A session is now being hosted by ${interaction.user}

Please ensure you have read #server-information and follow all RP rules.

-# Variable+ reactions required to start session.`,
          color: 0x89CFF0
        }
      ]
    });
  }

  // /work
  if (interaction.commandName === "work") {
    await interaction.reply("💰 You earned $500 RP money!");
  }
});

client.login(process.env.TOKEN);

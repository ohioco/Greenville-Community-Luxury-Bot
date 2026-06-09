const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const STAFF_ROLE = "1510346654241394848";
const BABY_BLUE  = 0x89CFF0;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("startup")
    .setDescription("Start an RP session (Staff only)")
    .addIntegerOption(o =>
      o.setName("reactions")
        .setDescription("Number of reactions required to start the session")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    }

    const reactionsNeeded = interaction.options.getInteger("reactions");

    interaction.client.sessionHost      = interaction.user.id;
    interaction.client.sessionCoHost    = null;
    interaction.client.sessionReactions = reactionsNeeded;

    const embed = new EmbedBuilder()
      .setTitle("Greenville Community Luxury™ | Session Startup")
      .setColor(BABY_BLUE)
      .setDescription(
`<@&1508054312075526204>

➜ **${interaction.user}** is now hosting a roleplay session! Prior to joining, please ensure your vehicle has been properly registered using \`/vehicle register\` before participating in the session.

➜ Please ensure that you have read & familiarised yourself with all server information and that you abide by these rules within session. Please check to make sure your vehicle isn't a banned vehicle.

-# In order for this session to begin, the host has requested **${reactionsNeeded}+** reactions!
-# React below to begin session.`
      )
      .setFooter({ text: "Greenville Community Luxury™ | Session Management" })
      .setTimestamp();

    await interaction.deferReply({ ephemeral: true });
    await interaction.deleteReply();
    const message = await interaction.channel.send({
      content: "<@&1508054312075526204>",
      embeds: [embed],
    });
    await message.react("✅");
  }
};

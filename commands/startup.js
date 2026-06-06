const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("startup")
    .setDescription("Start RP session with reaction requirement")
    .addIntegerOption(option =>
      option
        .setName("reactions")
        .setDescription("Number of reactions required to start session")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction) {

    const reactionsNeeded = interaction.options.getInteger("reactions");

    const embed = new EmbedBuilder()
      .setTitle("Greenville Community Luxury™ | Session Startup")
      .setDescription(
`> A session is now being hosted by ${interaction.user}

Please ensure you have read #server-information and follow all RP rules.

Please make sure your vehicle is not a banned vehicle.

---

Required Reactions: **${reactionsNeeded}+**

-# React below to begin session.`
      )
      .setColor(0x89CFF0);

    const message = await interaction.reply({
      embeds: [embed],
      fetchReply: true
    });

    // Add default reaction (optional)
    await message.react("✅");
  }
};

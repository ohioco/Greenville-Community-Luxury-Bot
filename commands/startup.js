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
      .setDescription( <@&1508054312075526204>
`A session is now being hosted by ${interaction.user}!

Please ensure that you have read & familiarised yourself with all #server-information and that you abide by these rules within session. Please check to make sure your vehicle isn't a banned vehicle.

-# In order for this session to begin, the host has requested ${reactionsNeeded}+ reactions!
-# React below to begin session.`
      )
      .setColor(0x89CFF0);

    const message = await interaction.reply({
      embeds: [embed],
      fetchReply: true
    });

    await message.react("✅");
  }
};

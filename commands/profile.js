const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const db = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View RP profile"),

  async execute(interaction) {
    const data = db.load();
    const id = interaction.user.id;

    const embed = new EmbedBuilder()
      .setTitle(`RP Profile - ${interaction.user.username}`)
      .setColor(0x89CFF0)
      .setDescription("Select a category below.");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("profile_tickets_warrants")
        .setLabel("Tickets & Warrants")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("profile_vehicles")
        .setLabel("Registrations & Plates")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};

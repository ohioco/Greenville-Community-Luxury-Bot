const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const db = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your RP profile"),

  async execute(interaction) {
    const data = db.load();
    const id = interaction.user.id;

    const vehicles = data.vehicles?.[id] || [];
    const warrants = data.warrants?.[id] || [];
    const tickets = data.tickets?.[id] || [];

    const embed = new EmbedBuilder()
      .setTitle(`RP Profile - ${interaction.user.username}`)
      .setColor(0x89CFF0)
      .setDescription("Select a category below to view details.");

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

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};

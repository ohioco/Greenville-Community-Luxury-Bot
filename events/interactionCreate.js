const { EmbedBuilder } = require("discord.js");
const db = require("../db");

module.exports = {
  name: "interactionCreate",

  async execute(interaction) {
    if (!interaction.isButton()) return;

    const data = db.load();
    if (!data.vehicles) data.vehicles = {};
    if (!data.warrants) data.warrants = {};
    if (!data.tickets) data.tickets = {};

    const id = interaction.user.id;

    const vehicles = data.vehicles[id] || [];
    const warrants = data.warrants[id] || [];
    const tickets = data.tickets[id] || [];

    await interaction.deferReply({ ephemeral: true });

    if (interaction.customId === "profile_tickets_warrants") {
      const embed = new EmbedBuilder()
        .setTitle("Tickets & Warrants")
        .setColor(0xFF5555)
        .addFields(
          { name: "Tickets", value: tickets.length ? tickets.join("\n") : "None" },
          { name: "Warrants", value: warrants.length ? warrants.join("\n") : "None" }
        );

      return interaction.editReply({ embeds: [embed] });
    }

    if (interaction.customId === "profile_vehicles") {
      const embed = new EmbedBuilder()
        .setTitle("Vehicles & Plates")
        .setColor(0x55AAFF)
        .addFields({
          name: "Vehicles",
          value: vehicles.length
            ? vehicles.map(v => `• ${v.brand} ${v.model} | ${v.plate} | ${v.color}`).join("\n")
            : "None"
        });

      return interaction.editReply({ embeds: [embed] });
    }
  }
};

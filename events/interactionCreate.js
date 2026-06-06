const { EmbedBuilder } = require("discord.js");
const db = require("../db");

module.exports = {
  name: "interactionCreate",

  async execute(interaction) {
    if (!interaction.isButton()) return;

    const data = db.load();
    const id = interaction.user.id;

    const vehicles = data.vehicles?.[id] || [];
    const warrants = data.warrants?.[id] || [];
    const tickets = data.tickets?.[id] || [];

    if (interaction.customId === "profile_tickets_warrants") {

      const embed = new EmbedBuilder()
        .setTitle("Tickets & Warrants")
        .setColor(0xFF5555)
        .addFields(
          {
            name: "Tickets",
            value: tickets.length ? tickets.map(t => `• ${t}`).join("\n") : "None"
          },
          {
            name: "Warrants",
            value: warrants.length ? warrants.join("\n") : "None"
          }
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.customId === "profile_vehicles") {

      const embed = new EmbedBuilder()
        .setTitle("Vehicle Registrations")
        .setColor(0x55AAFF)
        .addFields({
          name: "Owned Vehicles",
          value: vehicles.length
            ? vehicles.map(v => `• ${v.brand} ${v.model} | Plate: ${v.plate}`).join("\n")
            : "None"
        });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};

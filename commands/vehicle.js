const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vehicle")
    .setDescription("Vehicle commands")
    .addSubcommand(sub =>
      sub
        .setName("register")
        .setDescription("Register a vehicle")
        .addStringOption(o => o.setName("year").setDescription("Vehicle Year").setRequired(true))
        .addStringOption(o => o.setName("brand").setDescription("Vehicle brand").setRequired(true))
        .addStringOption(o => o.setName("model").setDescription("Vehicle model").setRequired(true))
        .addStringOption(o => o.setName("color").setDescription("Vehicle color").setRequired(true))
        .addStringOption(o => o.setName("plate").setDescription("Vehicle plate number").setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName("lookup")
        .setDescription("Look up a vehicle by plate number")
        .addStringOption(o =>
          o.setName("plate").setDescription("Plate number to look up").setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const data = db.load();
    if (!data.vehicles) data.vehicles = {};

    // ── REGISTER ──────────────────────────────────────────────────────────[...]
    if (sub === "register") {
      const id = interaction.user.id;
      if (!data.vehicles[id]) data.vehicles[id] = [];

      const plate = interaction.options.getString("plate").toUpperCase();

      const plateTaken = Object.values(data.vehicles).some(arr =>
        arr.some(v => v.plate === plate)
      );
      if (plateTaken) {
        return interaction.reply({
          content: `❌ Plate **${plate}** is already registered to another vehicle.`,
          ephemeral: true
        });
      }

      const vehicle = {
        id: Date.now().toString(),
        year: interaction.options.getString("year"),
        brand: interaction.options.getString("brand"),
        model: interaction.options.getString("model"),
        color: interaction.options.getString("color"),
        plate,
        registeredAt: new Date().toISOString(),
        registeredBy: id
      };

      data.vehicles[id].push(vehicle);
      db.save(data);

      const embed = new EmbedBuilder()
        .setTitle("🚗 Vehicle Registered")
        .setColor(0x89CFF0)
        .addFields(
          { name: "Year", value: vehicle.year, inline: true },
          { name: "Brand", value: vehicle.brand, inline: true },
          { name: "Model", value: vehicle.model, inline: true },
          { name: "Color", value: vehicle.color, inline: true },
          { name: "Plate", value: vehicle.plate, inline: true },
          { name: "Registered", value: `<t:${Math.floor(new Date(vehicle.registeredAt).getTime()/1000)}:R>`, inline: true }
        )
        .setFooter({ text: `Vehicle ID: ${vehicle.id}` });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── LOOKUP ────────────────────────────────────────────────────────────[...]
    if (sub === "lookup") {
      const plate = interaction.options.getString("plate").toUpperCase();

      let found = null;
      let ownerId = null;

      for (const [uid, vehicles] of Object.entries(data.vehicles)) {
        const match = vehicles.find(v => v.plate === plate);
        if (match) {
          found = match;
          ownerId = uid;
          break;
        }
      }

      if (!found) {
        return interaction.reply({
          content: `🔍 No vehicle found with plate **${plate}**.`,
          ephemeral: true
        });
      }

      // Get owner's warrants & tickets for context
      const warrants = (data.warrants || {})[ownerId] || [];
      const tickets  = (data.tickets  || {})[ownerId] || [];

      const embed = new EmbedBuilder()
        .setTitle(`🔍 Vehicle Lookup — ${plate}`)
        .setColor(0xFFAA00)
        .addFields(
          { name: "Year",  value: found.year,  inline: true },
          { name: "Brand",  value: found.brand,  inline: true },
          { name: "Model",  value: found.model,  inline: true },
          { name: "Color",  value: found.color,  inline: true },
          { name: "Plate",  value: found.plate,  inline: true },
          { name: "Owner",  value: `<@${ownerId}>`, inline: true },
          {
            name: "Registered",
            value: `<t:${Math.floor(new Date(found.registeredAt).getTime()/1000)}:D>`,
            inline: true
          },
          { name: "⚖️ Active Warrants", value: warrants.length ? `${warrants.length}` : "None", inline: true },
          { name: "🎫 Tickets on File", value: tickets.length  ? `${tickets.length}`  : "None", inline: true }
        )
        .setFooter({ text: `Vehicle ID: ${found.id}` });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};

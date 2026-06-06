const { SlashCommandBuilder } = require("discord.js");
const db = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("plate")
    .setDescription("Create or assign plates")

    .addStringOption(o =>
      o
        .setName("number")
        .setDescription("Plate number") // ✅ REQUIRED
        .setRequired(true)
    )

    .addStringOption(o =>
      o
        .setName("action")
        .setDescription("Choose an action") // ✅ REQUIRED
        .setRequired(true)
        .addChoices(
          { name: "Create", value: "create" },
          { name: "Assign", value: "assign" }
        )
    ),

  async execute(interaction) {
    const data = db.load();
    if (!data.plates) data.plates = {};

    const number = interaction.options.getString("number");
    const action = interaction.options.getString("action");

    if (action === "create") {
      if (data.plates[number]) {
        return interaction.reply({
          content: "❌ Plate already exists.",
          ephemeral: true
        });
      }

      data.plates[number] = {
        owner: null,
        createdBy: interaction.user.id
      };

      db.save(data);

      return interaction.reply(`🪪 Plate **${number}** created.`);
    }

    if (action === "assign") {
      if (!data.plates[number]) {
        return interaction.reply({
          content: "❌ Plate does not exist.",
          ephemeral: true
        });
      }

      if (data.plates[number].owner) {
        return interaction.reply({
          content: "❌ Plate already assigned.",
          ephemeral: true
        });
      }

      data.plates[number].owner = interaction.user.id;
      db.save(data);

      return interaction.reply(`🪪 Plate **${number}** assigned to you.`);
    }
  }
};

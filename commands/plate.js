const { SlashCommandBuilder } = require("discord.js");
const db = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("plate")
    .setDescription("Create or assign plates")
    .addStringOption(o => o.setName("number").setRequired(true))
    .addStringOption(o => o.setName("action").setRequired(true)),

  async execute(interaction) {
    const data = db.load();

    const number = interaction.options.getString("number");
    const action = interaction.options.getString("action");

    if (!data.plates[number]) {
      data.plates[number] = { owner: null };
    }

    if (action === "assign") {
      data.plates[number].owner = interaction.user.id;
      db.save(data);
      return interaction.reply("🪪 Plate assigned!");
    }

    if (action === "create") {
      db.save(data);
      return interaction.reply("🪪 Plate created!");
    }
  }
};

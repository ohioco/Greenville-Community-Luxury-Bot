const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../db");

const LAW_ENFORCEMENT_ROLES = [
  "1513443901577363589",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warrant")
    .setDescription("Issue a warrant for a player (law enforcement only)")
    .addUserOption(o =>
      o.setName("user").setDescription("Target user").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason for warrant").setRequired(true)
    ),

  async execute(interaction) {
    const memberRoles = interaction.member.roles.cache;
    const isLE = LAW_ENFORCEMENT_ROLES.some(rid => memberRoles.has(rid));

    if (!isLE) {
      return interaction.reply({
        content: "❌ You must be a law enforcement officer to issue warrants.",
        ephemeral: true
      });
    }

    const data = db.load();
    if (!data.warrants) data.warrants = {};

    const user   = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");

    if (!data.warrants[user.id]) data.warrants[user.id] = [];

    const warrant = {
      id: Date.now().toString(),
      reason,
      issuedBy: interaction.user.id,
      issuedByTag: interaction.user.tag,
      issuedAt: new Date().toISOString()
    };

    data.warrants[user.id].push(warrant);
    db.save(data);

    const embed = new EmbedBuilder()
      .setTitle("⚖️ Warrant Issued")
      .setColor(0xFF5555)
      .addFields(
        { name: "Officer", value: interaction.user.tag, inline: true },
        { name: "Target",  value: user.tag,             inline: true },
        { name: "Reason",  value: reason,               inline: false },
        { name: "Issued",  value: `<t:${Math.floor(Date.now()/1000)}:R>`, inline: true }
      )
      .setFooter({ text: `Warrant ID: ${warrant.id}` });

    await interaction.reply({ embeds: [embed] });
  }
};

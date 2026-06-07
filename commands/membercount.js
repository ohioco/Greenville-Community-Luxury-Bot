const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const STAFF_ROLE = "1510346654241394848";
const BABY_BLUE  = 0x89CFF0;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("membercount")
    .setDescription("Shows the server member count"),

  async execute(interaction) {
    await interaction.guild.members.fetch();
    const total = interaction.guild.memberCount;
    const bots  = interaction.guild.members.cache.filter(m => m.user.bot).size;
    const human = total - bots;

    const embed = new EmbedBuilder()
      .setTitle("Greenville Community Luxury™ | Member Count")
      .setColor(BABY_BLUE)
      .addFields(
        { name: "Total",  value: `${total}`, inline: true },
      )
      .setFooter({ text: "Greenville Community Luxury™" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};

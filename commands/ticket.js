const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../db");

// Law enforcement role IDs — edit these to match your server
const LAW_ENFORCEMENT_ROLES = [
  "1513443901577363589",  // public services role ID
  // Add more as needed
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Law enforcement ticket commands")
    .addSubcommand(sub =>
      sub
        .setName("issue")
        .setDescription("Issue a ticket to a player (law enforcement only)")
        .addUserOption(o =>
          o.setName("user").setDescription("Player to ticket").setRequired(true)
        )
        .addStringOption(o =>
          o.setName("violation").setDescription("Violation/reason").setRequired(true)
        )
        .addIntegerOption(o =>
          o.setName("fine")
            .setDescription("Fine amount in dollars")
            .setRequired(true)
            .setMinValue(1)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "issue") {
      // Check law enforcement role
      const memberRoles = interaction.member.roles.cache;
      const isLE = LAW_ENFORCEMENT_ROLES.some(rid => memberRoles.has(rid));

      if (!isLE) {
        return interaction.reply({
          content: "❌ You must be a law enforcement officer to issue tickets.",
          ephemeral: true
        });
      }

      const target    = interaction.options.getUser("user");
      const violation = interaction.options.getString("violation");
      const fine      = interaction.options.getInteger("fine");

      const data = db.load();
      if (!data.tickets)  data.tickets  = {};
      if (!data.economy)  data.economy  = {};

      if (!data.tickets[target.id]) data.tickets[target.id] = [];

      const ticket = {
        id: Date.now().toString(),
        violation,
        fine,
        issuedBy: interaction.user.id,
        issuedByTag: interaction.user.tag,
        issuedAt: new Date().toISOString(),
        paid: false
      };

      data.tickets[target.id].push(ticket);

      // Deduct fine from on-hand cash first, then bank
      if (!data.economy[target.id]) {
        data.economy[target.id] = { bank: 0, cash: 0, lastWork: null };
      }
      const eco = data.economy[target.id];
      let remaining = fine;
      if (eco.cash >= remaining) {
        eco.cash -= remaining;
        remaining = 0;
      } else {
        remaining -= eco.cash;
        eco.cash = 0;
        if (eco.bank >= remaining) {
          eco.bank -= remaining;
          remaining = 0;
        } else {
          eco.bank = 0;
          // remaining debt ignored — player is broke
        }
      }

      db.save(data);

      const embed = new EmbedBuilder()
        .setTitle("🎫 Ticket Issued")
        .setColor(0xFF5555)
        .addFields(
          { name: "Officer",    value: interaction.user.tag,        inline: true },
          { name: "Recipient",  value: target.tag,                  inline: true },
          { name: "Violation",  value: violation,                   inline: false },
          { name: "Fine",       value: `$${fine.toLocaleString()}`, inline: true },
          { name: "Issued",     value: `<t:${Math.floor(Date.now()/1000)}:R>`, inline: true }
        )
        .setFooter({ text: `Ticket ID: ${ticket.id}` });

      // DM the ticketed player
      try {
        await target.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("🚨 You have been issued a ticket!")
              .setColor(0xFF5555)
              .addFields(
                { name: "Officer",   value: interaction.user.tag,        inline: true },
                { name: "Violation", value: violation,                   inline: false },
                { name: "Fine",      value: `$${fine.toLocaleString()}`, inline: true }
              )
          ]
        });
      } catch {}

      return interaction.reply({ embeds: [embed] });
    }
  }
};

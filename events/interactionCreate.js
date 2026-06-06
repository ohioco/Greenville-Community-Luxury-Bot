const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const db = require("../db");

module.exports = {
  name: "interactionCreate",

  async execute(interaction) {
    // ── SLASH COMMANDS ────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(err);
        const reply = { content: "❌ An error occurred.", ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
      return;
    }

    // ── BUTTON INTERACTIONS ───────────────────────────────────────────────────
    if (!interaction.isButton()) return;

    const data = db.load();
    const id   = interaction.user.id;

    const warrants = (data.warrants || {})[id] || [];
    const tickets  = (data.tickets  || {})[id] || [];
    const vehicles = (data.vehicles || {})[id] || [];
    const eco      = (data.economy  || {})[id]  || { bank: 0, cash: 0, lastWork: null };

    await interaction.deferReply({ ephemeral: true });

    // ── WARRANTS ──────────────────────────────────────────────────────────────
    if (interaction.customId === "profile_warrants") {
      if (!warrants.length) {
        return interaction.editReply({ content: "✅ You have no active warrants." });
      }

      const embed = new EmbedBuilder()
        .setTitle("⚖️ Your Warrants")
        .setColor(0xFF5555);

      warrants.forEach((w, i) => {
        // Support both old string format and new object format
        if (typeof w === "string") {
          embed.addFields({ name: `Warrant #${i + 1}`, value: w });
        } else {
          embed.addFields({
            name: `Warrant #${i + 1} • ${w.id}`,
            value: [
              `**Reason:** ${w.reason}`,
              `**Issued by:** ${w.issuedByTag}`,
              `**Date:** <t:${Math.floor(new Date(w.issuedAt).getTime()/1000)}:D>`
            ].join("\n")
          });
        }
      });

      // Buttons for each warrant (view detail — expandable in future)
      const rows = buildWarrantButtons(warrants);
      return interaction.editReply({ embeds: [embed], components: rows });
    }

    // ── TICKETS ───────────────────────────────────────────────────────────────
    if (interaction.customId === "profile_tickets") {
      if (!tickets.length) {
        return interaction.editReply({ content: "✅ You have no tickets on file." });
      }

      const embed = new EmbedBuilder()
        .setTitle("🎫 Your Tickets")
        .setColor(0xFFA500);

      tickets.forEach((t, i) => {
        if (typeof t === "string") {
          embed.addFields({ name: `Ticket #${i + 1}`, value: t });
        } else {
          embed.addFields({
            name: `Ticket #${i + 1} — $${t.fine?.toLocaleString() ?? "N/A"}`,
            value: [
              `**Violation:** ${t.violation}`,
              `**Officer:** ${t.issuedByTag}`,
              `**Date:** <t:${Math.floor(new Date(t.issuedAt).getTime()/1000)}:D>`,
              `**Status:** ${t.paid ? "✅ Paid" : "❌ Unpaid"}`
            ].join("\n")
          });
        }
      });

      const rows = buildTicketButtons(tickets);
      return interaction.editReply({ embeds: [embed], components: rows });
    }

    // ── VEHICLES ──────────────────────────────────────────────────────────────
    if (interaction.customId === "profile_vehicles") {
      if (!vehicles.length) {
        return interaction.editReply({ content: "🚗 You have no registered vehicles." });
      }

      const embed = new EmbedBuilder()
        .setTitle("🚗 Your Registered Vehicles")
        .setColor(0x55AAFF);

      vehicles.forEach((v, i) => {
        embed.addFields({
          name: `Vehicle #${i + 1} — ${v.plate}`,
          value: [
            `**${v.brand} ${v.model}** (${v.color})`,
            `**Plate:** \`${v.plate}\``,
            `**Registered:** <t:${Math.floor(new Date(v.registeredAt || Date.now()).getTime()/1000)}:D>`
          ].join("\n"),
          inline: true
        });
      });

      const rows = buildVehicleButtons(vehicles);
      return interaction.editReply({ embeds: [embed], components: rows });
    }

    // ── ECONOMY ───────────────────────────────────────────────────────────────
    if (interaction.customId === "profile_economy") {
      const embed = new EmbedBuilder()
        .setTitle("💰 Your Balance")
        .setColor(0x57F287)
        .addFields(
          { name: "🏦 Bank",     value: `$${eco.bank.toLocaleString()}`, inline: true },
          { name: "💵 On Hand",  value: `$${eco.cash.toLocaleString()}`, inline: true },
          { name: "📊 Total",    value: `$${(eco.bank + eco.cash).toLocaleString()}`, inline: true },
          {
            name: "⏰ Last Work",
            value: eco.lastWork
              ? `<t:${Math.floor(new Date(eco.lastWork).getTime()/1000)}:R>`
              : "Never",
            inline: true
          }
        );
      return interaction.editReply({ embeds: [embed] });
    }

    // ── INDIVIDUAL VEHICLE DETAIL ─────────────────────────────────────────────
    if (interaction.customId.startsWith("vehicle_detail_")) {
      const vid = interaction.customId.replace("vehicle_detail_", "");
      const vehicle = vehicles.find(v => v.id === vid || v.plate === vid);
      if (!vehicle) return interaction.editReply({ content: "❌ Vehicle not found." });

      const embed = new EmbedBuilder()
        .setTitle(`🚗 Vehicle Registration — ${vehicle.plate}`)
        .setColor(0x55AAFF)
        .addFields(
          { name: "Brand",       value: vehicle.brand,   inline: true },
          { name: "Model",       value: vehicle.model,   inline: true },
          { name: "Color",       value: vehicle.color,   inline: true },
          { name: "Plate",       value: vehicle.plate,   inline: true },
          { name: "Owner",       value: `<@${id}>`,      inline: true },
          {
            name: "Registered",
            value: `<t:${Math.floor(new Date(vehicle.registeredAt || Date.now()).getTime()/1000)}:D>`,
            inline: true
          }
        )
        .setFooter({ text: `Vehicle ID: ${vehicle.id}` });

      return interaction.editReply({ embeds: [embed] });
    }

    // ── INDIVIDUAL TICKET DETAIL ──────────────────────────────────────────────
    if (interaction.customId.startsWith("ticket_detail_")) {
      const tid = interaction.customId.replace("ticket_detail_", "");
      const ticket = tickets.find(t => t.id === tid);
      if (!ticket) return interaction.editReply({ content: "❌ Ticket not found." });

      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket — #${ticket.id}`)
        .setColor(0xFFA500)
        .addFields(
          { name: "Violation",  value: ticket.violation,                   inline: false },
          { name: "Fine",       value: `$${ticket.fine?.toLocaleString() ?? "N/A"}`, inline: true },
          { name: "Officer",    value: ticket.issuedByTag,                 inline: true },
          { name: "Issued",     value: `<t:${Math.floor(new Date(ticket.issuedAt).getTime()/1000)}:D>`, inline: true },
          { name: "Status",     value: ticket.paid ? "✅ Paid" : "❌ Unpaid", inline: true }
        )
        .setFooter({ text: `Ticket ID: ${ticket.id}` });

      return interaction.editReply({ embeds: [embed] });
    }

    // ── INDIVIDUAL WARRANT DETAIL ─────────────────────────────────────────────
    if (interaction.customId.startsWith("warrant_detail_")) {
      const wid = interaction.customId.replace("warrant_detail_", "");
      const warrant = warrants.find(w => w.id === wid);
      if (!warrant) return interaction.editReply({ content: "❌ Warrant not found." });

      const embed = new EmbedBuilder()
        .setTitle(`⚖️ Warrant — #${warrant.id}`)
        .setColor(0xFF5555)
        .addFields(
          { name: "Reason",   value: warrant.reason,       inline: false },
          { name: "Officer",  value: warrant.issuedByTag,  inline: true },
          { name: "Issued",   value: `<t:${Math.floor(new Date(warrant.issuedAt).getTime()/1000)}:D>`, inline: true }
        )
        .setFooter({ text: `Warrant ID: ${warrant.id}` });

      return interaction.editReply({ embeds: [embed] });
    }
  }
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

function buildVehicleButtons(vehicles) {
  const rows = [];
  // Max 5 buttons per row, max 5 rows = 25 buttons
  const chunks = chunkArray(vehicles.slice(0, 25), 5);
  for (const chunk of chunks) {
    const row = new ActionRowBuilder();
    for (const v of chunk) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`vehicle_detail_${v.id || v.plate}`)
          .setLabel(`🚗 ${v.plate}`)
          .setStyle(ButtonStyle.Secondary)
      );
    }
    rows.push(row);
  }
  return rows;
}

function buildTicketButtons(tickets) {
  const rows = [];
  const chunks = chunkArray(tickets.slice(0, 25), 5);
  for (const [ci, chunk] of chunks.entries()) {
    const row = new ActionRowBuilder();
    for (const [ti, t] of chunk.entries()) {
      if (typeof t === "string") continue;
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_detail_${t.id}`)
          .setLabel(`🎫 Ticket #${ci * 5 + ti + 1}`)
          .setStyle(ButtonStyle.Primary)
      );
    }
    if (row.components.length) rows.push(row);
  }
  return rows;
}

function buildWarrantButtons(warrants) {
  const rows = [];
  const chunks = chunkArray(warrants.filter(w => typeof w === "object").slice(0, 25), 5);
  for (const [ci, chunk] of chunks.entries()) {
    const row = new ActionRowBuilder();
    for (const [wi, w] of chunk.entries()) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`warrant_detail_${w.id}`)
          .setLabel(`⚖️ Warrant #${ci * 5 + wi + 1}`)
          .setStyle(ButtonStyle.Danger)
      );
    }
    if (row.components.length) rows.push(row);
  }
  return rows;
}

function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

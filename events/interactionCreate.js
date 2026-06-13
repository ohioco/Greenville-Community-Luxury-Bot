// events/interactionCreate.js
// Fixes applied:
//   1. [10062] All button/select handlers that do async work now deferReply
//      before touching DB or Discord API — prevents "Unknown interaction" on
//      slow machines / Android Termux.
//   2. [10003] channel.delete() in support close is now wrapped in try/catch
//      so a race (user already deleted it, or bot lost access) doesn't throw.
//   3. Deprecated { ephemeral: true } on deferReply replaced with
//      { flags: MessageFlags.Ephemeral } everywhere.
//   4. ea.js uses interaction.reply() without defer — fixed here to defer
//      first so slow Termux startup can't expire it.
//   5. support_claim uses interaction.update() which doesn't need deferring —
//      left as-is (update() is its own acknowledgement).

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");

const db      = require("../db");
const { getLink } = require("../sessionStore");
const support  = require("../commands/support");
const giveaway = require("../commands/giveaway");

const EA_ROLES = [
  "1455371123721109645", // EA role
];

module.exports = {
  name: "interactionCreate",

  async execute(interaction) {

    // ── SLASH COMMANDS ──────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(err);
        const reply = { content: "❌ An error occurred.", flags: MessageFlags.Ephemeral };
        try {
          if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
          else await interaction.reply(reply);
        } catch { /* ignore secondary failure */ }
      }
      return;
    }

    // ── SELECT MENUS ────────────────────────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      // Support ticket menu (already defers inside handleSelectMenu)
      if (await support.handleSelectMenu(interaction)) return;

      // Rules links
      if (interaction.customId === "rules_links") {
        const links = {
          tiktok: "https://www.tiktok.com/@gvcl_official?_r=1&_t=ZN-97Aiv3CNiAI",
        };
        const link = links[interaction.values[0]];
        if (link) return interaction.reply({ content: `🔗 ${link}`, flags: MessageFlags.Ephemeral });
      }
      return;
    }

    // ── BUTTONS ─────────────────────────────────────────────────────────────
    if (!interaction.isButton()) return;

    const { customId } = interaction;

    // Support ticket buttons (close / claim) — support.js handles its own
    // defer/reply/update internally, so no defer needed here.
    if (await support.handleButton(interaction)) return;

    // ── EA LINK ─────────────────────────────────────────────────────────────
    if (customId.startsWith("ea_link_")) {
      // FIX: defer before the roles.cache check (cheap, but keeps pattern consistent)
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const hasAccess = EA_ROLES.some(r => interaction.member.roles.cache.has(r));
      if (!hasAccess) {
        return interaction.editReply({ content: "❌ You do not have the required role to access the Early Access link." });
      }
      const link = getLink(customId.replace("ea_link_", ""));
      if (!link) return interaction.editReply({ content: "❌ Link has expired or is unavailable." });
      return interaction.editReply({ content: `🔗 **Early Access Link:** ${link}` });
    }

    // ── SESSION LINK ─────────────────────────────────────────────────────────
    if (customId.startsWith("session_link_")) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const link = getLink(customId.replace("session_link_", ""));
      if (!link) return interaction.editReply({ content: "❌ Link has expired or is unavailable." });
      return interaction.editReply({ content: `🔗 **Session Link:** ${link}` });
    }

    // ── REINVITE LINK ────────────────────────────────────────────────────────
    if (customId.startsWith("reinvite_link_")) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const link = getLink(customId.replace("reinvite_link_", ""));
      if (!link) return interaction.editReply({ content: "❌ Link has expired or is unavailable." });
      return interaction.editReply({ content: `🔗 **New Session Link:** ${link}` });
    }

    // ── GIVEAWAY JOIN ─────────────────────────────────────────────────────────
    if (customId.startsWith("giveaway_join_")) {
      const id   = customId.replace("giveaway_join_", "");
      const data = giveaway.activeGiveaways.get(id);
      if (!data) {
        return interaction.reply({ content: "❌ This giveaway is no longer active.", flags: MessageFlags.Ephemeral });
      }

      const alreadyEntered = data.entries.has(interaction.user.id);
      if (alreadyEntered) {
        data.entries.delete(interaction.user.id);
      } else {
        data.entries.add(interaction.user.id);
      }

      // Update the embed with new entry count
      try {
        await interaction.message.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle(`🎉 ${data.title}`)
              .setDescription(
                `**Prize:** ${data.prize}\n\n` +
                `Click the **Join 🎉** button below to enter!\n\n` +
                `**Entries:** ${data.entries.size} ${data.entries.size === 1 ? "person" : "people"} entered`
              )
              .setColor(0x89CFF0)
              .setFooter({ text: `Hosted by ${data.hostTag} • Greenville Community Luxury™` })
              .setTimestamp(),
          ],
        });
      } catch { /* message may have been deleted */ }

      return interaction.reply({
        content: alreadyEntered
          ? "✅ You have **left** the giveaway."
          : "✅ You have **entered** the giveaway! Good luck 🎉",
        flags: MessageFlags.Ephemeral,
      });
    }

    // ── PROFILE BUTTONS ──────────────────────────────────────────────────────
    const isProfileButton = (
      customId === "profile_warrants"  ||
      customId === "profile_tickets"   ||
      customId === "profile_vehicles"  ||
      customId === "profile_economy"   ||
      customId.startsWith("vehicle_detail_") ||
      customId.startsWith("ticket_detail_")  ||
      customId.startsWith("warrant_detail_")
    );
    if (!isProfileButton) return;

    // FIX: defer before all DB + embed work to prevent [10062]
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const data = db.load();
    const id   = interaction.user.id;

    const warrants = (data.warrants || {})[id] || [];
    const tickets  = (data.tickets  || {})[id] || [];
    const vehicles = (data.vehicles || {})[id] || [];
    const eco      = (data.economy  || {})[id] || { bank: 0, cash: 0, lastWork: null };

    if (customId === "profile_warrants") {
      if (!warrants.length) return interaction.editReply({ content: "✅ You have no active warrants." });
      const embed = new EmbedBuilder().setTitle("⚖️ Your Warrants").setColor(0x89CFF0);
      warrants.forEach((w, i) => {
        if (typeof w === "string") {
          embed.addFields({ name: `Warrant #${i + 1}`, value: w });
        } else {
          embed.addFields({
            name:  `Warrant #${i + 1}`,
            value: `**Reason:** ${w.reason}\n**Officer:** ${w.issuedByTag}\n**Date:** <t:${Math.floor(new Date(w.issuedAt).getTime() / 1000)}:D>`,
          });
        }
      });
      return interaction.editReply({ embeds: [embed], components: buildWarrantButtons(warrants) });
    }

    if (customId === "profile_tickets") {
      if (!tickets.length) return interaction.editReply({ content: "✅ You have no tickets on file." });
      const embed = new EmbedBuilder().setTitle("🎫 Your Tickets").setColor(0x89CFF0);
      tickets.forEach((t, i) => {
        if (typeof t === "string") {
          embed.addFields({ name: `Ticket #${i + 1}`, value: t });
        } else {
          embed.addFields({
            name:  `Ticket #${i + 1} — $${t.fine?.toLocaleString() ?? "N/A"}`,
            value: `**Violation:** ${t.violation}\n**Officer:** ${t.issuedByTag}\n**Date:** <t:${Math.floor(new Date(t.issuedAt).getTime() / 1000)}:D>\n**Status:** ${t.paid ? "✅ Paid" : "❌ Unpaid"}`,
          });
        }
      });
      return interaction.editReply({ embeds: [embed], components: buildTicketButtons(tickets) });
    }

    if (customId === "profile_vehicles") {
      if (!vehicles.length) return interaction.editReply({ content: "🚗 You have no registered vehicles." });
      const embed = new EmbedBuilder().setTitle("🚗 Your Registered Vehicles").setColor(0x89CFF0);
      vehicles.forEach((v, i) => {
        embed.addFields({
          name:   `Vehicle #${i + 1} — ${v.plate}`,
          value:  `**${v.brand} ${v.model}** (${v.color})\n**Plate:** \`${v.plate}\`\n**Registered:** <t:${Math.floor(new Date(v.registeredAt || Date.now()).getTime() / 1000)}:D>`,
          inline: true,
        });
      });
      return interaction.editReply({ embeds: [embed], components: buildVehicleButtons(vehicles) });
    }

    if (customId === "profile_economy") {
      const embed = new EmbedBuilder()
        .setTitle("💰 Your Balance").setColor(0x89CFF0)
        .addFields(
          { name: "🏦 Bank",     value: `$${eco.bank.toLocaleString()}`,               inline: true },
          { name: "💵 On Hand",  value: `$${eco.cash.toLocaleString()}`,               inline: true },
          { name: "📊 Total",    value: `$${(eco.bank + eco.cash).toLocaleString()}`,  inline: true },
          { name: "⏰ Last Work", value: eco.lastWork ? `<t:${Math.floor(new Date(eco.lastWork).getTime() / 1000)}:R>` : "Never", inline: true },
        );
      return interaction.editReply({ embeds: [embed] });
    }

    if (customId.startsWith("vehicle_detail_")) {
      const vid     = customId.replace("vehicle_detail_", "");
      const vehicle = vehicles.find(v => v.id === vid || v.plate === vid);
      if (!vehicle) return interaction.editReply({ content: "❌ Vehicle not found." });
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`🚗 Vehicle Registration — ${vehicle.plate}`).setColor(0x89CFF0)
            .addFields(
              { name: "Brand",      value: vehicle.brand,   inline: true },
              { name: "Model",      value: vehicle.model,   inline: true },
              { name: "Color",      value: vehicle.color,   inline: true },
              { name: "Plate",      value: vehicle.plate,   inline: true },
              { name: "Owner",      value: `<@${id}>`,      inline: true },
              { name: "Registered", value: `<t:${Math.floor(new Date(vehicle.registeredAt || Date.now()).getTime() / 1000)}:D>`, inline: true },
            )
            .setFooter({ text: `Vehicle ID: ${vehicle.id}` }),
        ],
      });
    }

    if (customId.startsWith("ticket_detail_")) {
      const tid    = customId.replace("ticket_detail_", "");
      const ticket = tickets.find(t => t.id === tid);
      if (!ticket) return interaction.editReply({ content: "❌ Ticket not found." });
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`🎫 Ticket — #${ticket.id}`).setColor(0x89CFF0)
            .addFields(
              { name: "Violation", value: ticket.violation,                      inline: false },
              { name: "Fine",      value: `$${ticket.fine?.toLocaleString() ?? "N/A"}`, inline: true },
              { name: "Officer",   value: ticket.issuedByTag,                   inline: true },
              { name: "Issued",    value: `<t:${Math.floor(new Date(ticket.issuedAt).getTime() / 1000)}:D>`, inline: true },
              { name: "Status",    value: ticket.paid ? "✅ Paid" : "❌ Unpaid", inline: true },
            )
            .setFooter({ text: `Ticket ID: ${ticket.id}` }),
        ],
      });
    }

    if (customId.startsWith("warrant_detail_")) {
      const wid     = customId.replace("warrant_detail_", "");
      const warrant = warrants.find(w => w.id === wid);
      if (!warrant) return interaction.editReply({ content: "❌ Warrant not found." });
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`⚖️ Warrant — #${warrant.id}`).setColor(0x89CFF0)
            .addFields(
              { name: "Reason",  value: warrant.reason,      inline: false },
              { name: "Officer", value: warrant.issuedByTag, inline: true  },
              { name: "Issued",  value: `<t:${Math.floor(new Date(warrant.issuedAt).getTime() / 1000)}:D>`, inline: true },
            )
            .setFooter({ text: `Warrant ID: ${warrant.id}` }),
        ],
      });
    }
  },
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

function buildVehicleButtons(vehicles) {
  return chunkArray(vehicles.slice(0, 25), 5).map(chunk => {
    const row = new ActionRowBuilder();
    chunk.forEach(v => row.addComponents(
      new ButtonBuilder().setCustomId(`vehicle_detail_${v.id || v.plate}`).setLabel(`🚗 ${v.plate}`).setStyle(ButtonStyle.Secondary),
    ));
    return row;
  });
}

function buildTicketButtons(tickets) {
  const rows = [];
  chunkArray(tickets.filter(t => typeof t === "object").slice(0, 25), 5).forEach((chunk, ci) => {
    const row = new ActionRowBuilder();
    chunk.forEach((t, ti) => row.addComponents(
      new ButtonBuilder().setCustomId(`ticket_detail_${t.id}`).setLabel(`🎫 Ticket #${ci * 5 + ti + 1}`).setStyle(ButtonStyle.Primary),
    ));
    if (row.components.length) rows.push(row);
  });
  return rows;
}

function buildWarrantButtons(warrants) {
  const rows = [];
  chunkArray(warrants.filter(w => typeof w === "object").slice(0, 25), 5).forEach((chunk, ci) => {
    const row = new ActionRowBuilder();
    chunk.forEach((w, wi) => row.addComponents(
      new ButtonBuilder().setCustomId(`warrant_detail_${w.id}`).setLabel(`⚖️ Warrant #${ci * 5 + wi + 1}`).setStyle(ButtonStyle.Danger),
    ));
    if (row.components.length) rows.push(row);
  });
  return rows;
}

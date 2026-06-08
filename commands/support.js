// commands/support.js
// Drop into /commands. Then wire up interactionCreate.js per the instructions at the bottom.

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SUPPORT_CONFIG = {
  TICKET_CATEGORY_ID: "YOUR_TICKET_CATEGORY_ID",
  STAFF_ROLE_ID:      "YOUR_STAFF_ROLE_ID",
  LOG_CHANNEL_ID:     "YOUR_LOG_CHANNEL_ID",
};
// ─────────────────────────────────────────────────────────────────────────────

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");

const TICKET_TYPES = {
  general:  { label: "🎫 General Support",  color: 0x5865F2, prefix: "general",  pingStaff: false, description: "Ask a question or get help with a general issue."         },
  civilian: { label: "📋 Civilian Report",  color: 0xED4245, prefix: "report",   pingStaff: true,  description: "Report a player or in-game incident."                    },
  staff:    { label: "🛡️ Staff Support",    color: 0xFEE75C, prefix: "staff",    pingStaff: true,  description: "Contact senior staff for staff-related matters."         },
};

// userId -> channelId  (in-memory; resets on bot restart — acceptable for tickets)
const activeTickets = new Map();

// ── HELPERS ───────────────────────────────────────────────────────────────────
const cfg = SUPPORT_CONFIG;

function hasStaffRole(member) {
  return cfg.STAFF_ROLE_ID !== "YOUR_STAFF_ROLE_ID"
    ? member.roles.cache.has(cfg.STAFF_ROLE_ID)
    : member.permissions.has(PermissionFlagsBits.ManageChannels);
}

function ownerIdFromTopic(topic) {
  const m = topic?.match(/UID:(\d+)/);
  return m ? m[1] : null;
}

async function logAction(guild, { action, user, detail, color }) {
  if (cfg.LOG_CHANNEL_ID === "YOUR_LOG_CHANNEL_ID") return;
  const ch = guild.channels.cache.get(cfg.LOG_CHANNEL_ID);
  if (!ch) return;
  await ch.send({
    embeds: [
      new EmbedBuilder()
        .setTitle(`📋 ${action}`)
        .addFields(
          { name: "User",   value: `${user.tag} (${user.id})`, inline: true },
          { name: "Detail", value: detail ?? "—",              inline: true },
        )
        .setColor(color)
        .setTimestamp(),
    ],
  }).catch(console.error);
}

function ticketButtons(claimed = false, claimerName = "") {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("support_claim")
      .setLabel(claimed ? `Claimed by ${claimerName}` : "Claim")
      .setStyle(claimed ? ButtonStyle.Success : ButtonStyle.Primary)
      .setEmoji(claimed ? "✅" : "🙋")
      .setDisabled(claimed),
    new ButtonBuilder()
      .setCustomId("support_close")
      .setLabel("Close Ticket")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🔒"),
  );
}

// ── POST PANEL ────────────────────────────────────────────────────────────────
async function postPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle("🎟️  Support Center")
    .setDescription(
      "Need assistance? Choose a category below.\n\n" +
      "🎫 **General Support** — Questions or general issues\n" +
      "📋 **Civilian Report** — Report a player or incident\n" +
      "🛡️ **Staff Support** — Staff-related matters or appeals",
    )
    .setColor(0x2B2D31)
    .setFooter({ text: "Only open a ticket if you genuinely need help." })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("support_type_menu")
      .setPlaceholder("📂  Choose a support category...")
      .addOptions([
        { label: "General Support",  description: "Help with questions or issues",        value: "general",  emoji: "🎫" },
        { label: "Civilian Report",  description: "Report a player or in-game incident",  value: "civilian", emoji: "📋" },
        { label: "Staff Support",    description: "Contact senior staff",                 value: "staff",    emoji: "🛡️" },
      ]),
  );

  await channel.send({ embeds: [embed], components: [row] });
}

// ── CREATE TICKET ─────────────────────────────────────────────────────────────
async function handleSelectMenu(interaction) {
  if (interaction.customId !== "support_type_menu") return false;

  const type       = interaction.values[0];
  const ticketType = TICKET_TYPES[type];
  const { guild, user } = interaction;

  // Duplicate check
  const existingId = activeTickets.get(user.id);
  if (existingId) {
    const existing = guild.channels.cache.get(existingId);
    if (existing) {
      return interaction.reply({ content: `❌ You already have an open ticket: ${existing}`, ephemeral: true });
    }
    activeTickets.delete(user.id); // stale entry, clean up
  }

  await interaction.deferReply({ ephemeral: true });

  const ticketNumber = Date.now().toString().slice(-5);

  const permissionOverwrites = [
    { id: guild.roles.everyone,        deny:  [PermissionFlagsBits.ViewChannel] },
    { id: user.id,                     allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
    { id: interaction.client.user.id,  allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
  ];

  if (ticketType.pingStaff && cfg.STAFF_ROLE_ID !== "YOUR_STAFF_ROLE_ID") {
    permissionOverwrites.push({
      id: cfg.STAFF_ROLE_ID,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    });
  }

  const ticketChannel = await guild.channels.create({
    name:  `${ticketType.prefix}-${user.username}-${ticketNumber}`,
    type:  ChannelType.GuildText,
    parent: cfg.TICKET_CATEGORY_ID !== "YOUR_TICKET_CATEGORY_ID" ? cfg.TICKET_CATEGORY_ID : null,
    permissionOverwrites,
    // Compact topic keeps UID parsing simple and avoids spaces in the regex
    topic: `type:${type}|UID:${user.id}|ticket:${ticketNumber}`,
  });

  activeTickets.set(user.id, ticketChannel.id);

  const pingContent = ticketType.pingStaff && cfg.STAFF_ROLE_ID !== "YOUR_STAFF_ROLE_ID"
    ? `<@&${cfg.STAFF_ROLE_ID}> — New **${ticketType.label}** opened by ${user}`
    : `${user} — your ticket has been created!`;

  await ticketChannel.send({
    content: pingContent,
    embeds: [
      new EmbedBuilder()
        .setTitle(ticketType.label)
        .setDescription(
          `Welcome, ${user}!\n\n${ticketType.description}\n\n` +
          `Please describe your issue and a staff member will be with you shortly.\n\n` +
          `**Ticket ID:** \`${ticketNumber}\``,
        )
        .setColor(ticketType.color)
        .setTimestamp()
        .setFooter({ text: "Use the buttons below to manage this ticket." }),
    ],
    components: [ticketButtons()],
  });

  await logAction(guild, { action: "Ticket Opened", user, detail: ticketType.label, color: ticketType.color });
  await interaction.editReply({ content: `✅ Your ticket has been created: ${ticketChannel}` });
  return true;
}

// ── BUTTON ROUTER ─────────────────────────────────────────────────────────────
async function handleButton(interaction) {
  const { customId } = interaction;
  if (customId === "support_close") return handleClose(interaction);
  if (customId === "support_claim") return handleClaim(interaction);
  return false;
}

// ── CLOSE ─────────────────────────────────────────────────────────────────────
async function handleClose(interaction) {
  const { channel, guild, user } = interaction;

  const ownerId = ownerIdFromTopic(channel.topic);
  const isOwner = ownerId === user.id;

  if (!hasStaffRole(interaction.member) && !isOwner) {
    return interaction.reply({ content: "❌ You don't have permission to close this ticket.", ephemeral: true });
  }

  if (ownerId) activeTickets.delete(ownerId);

  await logAction(guild, { action: "Ticket Closed", user, detail: channel.name, color: 0xED4245 });
  await interaction.reply({ content: "🔒 Closing this ticket in **5 seconds**..." });
  setTimeout(() => channel.delete().catch(console.error), 5000);
  return true;
}

// ── CLAIM ─────────────────────────────────────────────────────────────────────
async function handleClaim(interaction) {
  if (!hasStaffRole(interaction.member)) {
    return interaction.reply({ content: "❌ Only staff can claim tickets.", ephemeral: true });
  }

  await interaction.update({ components: [ticketButtons(true, interaction.user.username)] });

  await interaction.channel.send({
    embeds: [
      new EmbedBuilder()
        .setDescription(`✅ This ticket has been claimed by ${interaction.user}`)
        .setColor(0x57F287)
        .setTimestamp(),
    ],
  });
  return true;
}

// ── COMMAND DEFINITION ────────────────────────────────────────────────────────
module.exports = {
  data: new SlashCommandBuilder()
    .setName("support")
    .setDescription("Support ticket commands")
    .addSubcommand(sub => sub.setName("panel").setDescription("Post the support panel (staff only)"))
    .addSubcommand(sub => sub.setName("close").setDescription("Close the current support ticket")),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "panel") {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: "❌ You need **Manage Server** permission.", ephemeral: true });
      }
      await postPanel(interaction.channel);
      return interaction.reply({ content: "✅ Support panel posted!", ephemeral: true });
    }
    if (sub === "close") return handleClose(interaction);
  },

  // Exported for interactionCreate.js
  handleSelectMenu,
  handleButton,
  activeTickets,
};

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PASTE INTO events/interactionCreate.js

  At the top of execute(), before any existing logic, add:

    const support = require("../commands/support");

  Then inside isStringSelectMenu():

    if (interaction.isStringSelectMenu()) {
      if (await support.handleSelectMenu(interaction)) return;   // ← add
      if (interaction.customId === "rules_links") { ... }
      return;
    }

  And inside isButton(), before the customId.startsWith("ea_link_") check:

    if (await support.handleButton(interaction)) return;   // ← add
    if (customId.startsWith("ea_link_")) { ... }
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

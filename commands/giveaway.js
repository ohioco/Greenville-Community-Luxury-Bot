// commands/giveaway.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");

const STAFF_ROLE  = "YOUR_GVCL_STAFF_ROLE_ID";
const BABY_BLUE   = 0x89CFF0;

// giveawayId -> { prize, title, hostId, hostTag, entries: Set<userId>, messageId, channelId }
const activeGiveaways = new Map();

// ── BUILD EMBED ───────────────────────────────────────────────────────────────
function buildEmbed(data) {
  const entries = data.entries.size;
  return new EmbedBuilder()
    .setTitle(`🎉 ${data.title}`)
    .setDescription(
      `**Prize:** ${data.prize}\n\n` +
      `Click the **Join 🎉** button below to enter!\n\n` +
      `**Entries:** ${entries} ${entries === 1 ? "person" : "people"} entered`
    )
    .setColor(BABY_BLUE)
    .setFooter({ text: `Hosted by ${data.hostTag} • Greenville Community Luxury™` })
    .setTimestamp();
}

// ── BUILD BUTTON ROW ──────────────────────────────────────────────────────────
function buildRow(giveawayId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`giveaway_join_${giveawayId}`)
      .setLabel("Join 🎉")
      .setStyle(ButtonStyle.Success),
  );
}

// ── COMMAND ───────────────────────────────────────────────────────────────────
module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Giveaway commands")
    .addSubcommand(sub =>
      sub
        .setName("start")
        .setDescription("Start a giveaway (Staff only)")
        .addStringOption(o =>
          o.setName("title").setDescription("Giveaway title").setRequired(true)
        )
        .addStringOption(o =>
          o.setName("prize").setDescription("What is being given away?").setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("end")
        .setDescription("End a giveaway and pick a winner (Staff only)")
        .addStringOption(o =>
          o.setName("id").setDescription("Giveaway ID (shown when created)").setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("cancel")
        .setDescription("Cancel a giveaway without picking a winner (Staff only)")
        .addStringOption(o =>
          o.setName("id").setDescription("Giveaway ID (shown when created)").setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ content: "❌ Only Staff can manage giveaways.", flags: MessageFlags.Ephemeral });
    }

    const sub = interaction.options.getSubcommand();

    // ── START ─────────────────────────────────────────────────────────────────
    if (sub === "start") {
      const title = interaction.options.getString("title");
      const prize = interaction.options.getString("prize");
      const id    = Date.now().toString(36).toUpperCase(); // short unique ID

      const data = {
        title,
        prize,
        hostId:    interaction.user.id,
        hostTag:   interaction.user.tag,
        entries:   new Set(),
        messageId: null,
        channelId: interaction.channelId,
      };

      const msg = await interaction.channel.send({
        embeds:     [buildEmbed(data)],
        components: [buildRow(id)],
      });

      data.messageId = msg.id;
      activeGiveaways.set(id, data);

      return interaction.reply({
        content: `✅ Giveaway started! **ID:** \`${id}\` — keep this to end or cancel it.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // ── END ───────────────────────────────────────────────────────────────────
    if (sub === "end") {
      const id   = interaction.options.getString("id").toUpperCase();
      const data = activeGiveaways.get(id);
      if (!data) return interaction.reply({ content: "❌ No active giveaway with that ID.", flags: MessageFlags.Ephemeral });

      const channel = interaction.client.channels.cache.get(data.channelId);
      const msg     = channel ? await channel.messages.fetch(data.messageId).catch(() => null) : null;

      const entries = [...data.entries];

      if (!entries.length) {
        // No entries — update embed and announce
        if (msg) {
          await msg.edit({
            embeds: [
              buildEmbed(data)
                .setTitle(`🎉 ${data.title} — Ended`)
                .setDescription(`**Prize:** ${data.prize}\n\n❌ No one entered — no winner.`)
                .setColor(0xED4245)
            ],
            components: [],
          });
        }
        activeGiveaways.delete(id);
        return interaction.reply({ content: "⚠️ Giveaway ended with no entries — no winner picked." });
      }

      const winnerId = entries[Math.floor(Math.random() * entries.length)];

      if (msg) {
        await msg.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle(`🎉 ${data.title} — Ended!`)
              .setDescription(
                `**Prize:** ${data.prize}\n\n` +
                `🏆 **Winner:** <@${winnerId}>\n\n` +
                `**Total entries:** ${entries.length}`
              )
              .setColor(0x57F287)
              .setFooter({ text: `Hosted by ${data.hostTag} • Greenville Community Luxury™` })
              .setTimestamp()
          ],
          components: [],
        });
      }

      activeGiveaways.delete(id);
      return interaction.reply({ content: `🏆 Giveaway ended! Winner: <@${winnerId}> — congratulations!` });
    }

    // ── CANCEL ────────────────────────────────────────────────────────────────
    if (sub === "cancel") {
      const id   = interaction.options.getString("id").toUpperCase();
      const data = activeGiveaways.get(id);
      if (!data) return interaction.reply({ content: "❌ No active giveaway with that ID.", flags: MessageFlags.Ephemeral });

      const channel = interaction.client.channels.cache.get(data.channelId);
      const msg     = channel ? await channel.messages.fetch(data.messageId).catch(() => null) : null;

      if (msg) {
        await msg.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle(`🎉 ${data.title} — Cancelled`)
              .setDescription(`**Prize:** ${data.prize}\n\n❌ This giveaway was cancelled.`)
              .setColor(0xED4245)
              .setFooter({ text: `Hosted by ${data.hostTag} • Greenville Community Luxury™` })
              .setTimestamp()
          ],
          components: [],
        });
      }

      activeGiveaways.delete(id);
      return interaction.reply({ content: "✅ Giveaway cancelled.", flags: MessageFlags.Ephemeral });
    }
  },

  // Exported so interactionCreate.js can handle the Join button
  activeGiveaways,
};

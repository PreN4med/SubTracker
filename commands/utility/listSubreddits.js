const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadTrackedSubreddits } = require('../../utils/dataUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listsubreddits') // Keep lowercase for Discord
    .setDescription('List tracked subreddits with filters'),
  async execute(interaction) {
    const trackedSubreddits = loadTrackedSubreddits();
    if (trackedSubreddits.length === 0) {
      return interaction.reply('No subreddits tracked yet. Use `/tracksubreddit` first!');
    }

    const filterButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('filter_top')
        .setLabel('Top Posts')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('filter_hot')
        .setLabel('Hot Posts')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('filter_new')
        .setLabel('New Posts')
        .setStyle(ButtonStyle.Primary),
    );

    await interaction.reply({
      content: `**Tracked Subreddits:**\n${trackedSubreddits.map(s => `• r/${s}`).join('\n')}\n\n**Filter posts:**`,
      components: [filterButtons],
    });
  },
};
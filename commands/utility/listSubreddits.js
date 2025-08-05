const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadTrackedSubreddits } = require('../../utils/dataUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listsubreddits')
    .setDescription('List tracked subreddits with filtering options'),
  async execute(interaction) {
    const trackedSubreddits = loadTrackedSubreddits();
    
    if (trackedSubreddits.length === 0) {
      return interaction.reply('No subreddits tracked yet. Use `/tracksubreddit` first!');
    }

    // Create a button row for each subreddit with filter options
    const subredditRows = trackedSubreddits.map(subreddit => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`filter_${subreddit}_top`)
          .setLabel(`Top in r/${subreddit}`)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`filter_${subreddit}_hot`)
          .setLabel(`Hot in r/${subreddit}`)
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`filter_${subreddit}_new`)
          .setLabel(`New in r/${subreddit}`)
          .setStyle(ButtonStyle.Primary)
      );
    });

    await interaction.reply({
      content: '**Tracked Subreddits:**\n' + 
               trackedSubreddits.map(s => `• r/${s}`).join('\n') +
               '\n\n**Select a filter for each subreddit:**',
      components: subredditRows,
    });
  },
};
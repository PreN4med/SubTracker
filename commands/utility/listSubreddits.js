// Importing functions
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadTrackedSubreddits } = require('../../utils/dataUtils');

module.exports = {

  // This creates the slash command
  data: new SlashCommandBuilder()
    .setName('listsubreddits')
    .setDescription('List tracked subreddits with filtering options'),
  async execute(interaction) {
    const trackedSubreddits = loadTrackedSubreddits();
    

    // No subreddits stored
    if (trackedSubreddits.length === 0) {
      return interaction.reply('No subreddits tracked yet. Use `/tracksubreddit` first!');
    }

    // Create a button row for each subreddit with filter options
    // Three categories, top post, hot post, and new post
    const subredditRows = trackedSubreddits.map(subreddit => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`filter_${subreddit}_top`)
          .setLabel(`Top in r/${subreddit}`)
          .setStyle(ButtonStyle.Success),             // success, danger, and primary are colors (green, red, blue)
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


    // The output/response the bot will give
    await interaction.reply({
      content: '**Tracked Subreddits:**\n' + 
               trackedSubreddits.map(s => `• r/${s}`).join('\n') +
               '\n\n**Select a filter for each subreddit:**',
      components: subredditRows,
    });
  },
};
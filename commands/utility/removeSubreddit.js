// Importing functions
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadTrackedSubreddits, saveTrackedSubreddits } = require('../../utils/dataUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removesubreddit')
    .setDescription('Remove a tracked subreddit'),
  async execute(interaction) {
    const trackedSubreddits = loadTrackedSubreddits();

    // No subreddits to remove
    if (trackedSubreddits.length === 0) {
      return interaction.reply('❌ No subreddits are currently being tracked.');
    }

    // Create buttons for each tracked subreddit
    const subredditButtons = trackedSubreddits.map(subreddit =>
      new ButtonBuilder()
        .setCustomId(`remove_${subreddit}`)
        .setLabel(`r/${subreddit}`)
        .setStyle(ButtonStyle.Danger)
    );

    // Split buttons into rows 
    const buttonRows = [];
    for (let i = 0; i < subredditButtons.length; i += 5) {
      buttonRows.push(
        new ActionRowBuilder().addComponents(
          subredditButtons.slice(i, i + 5)
        )
      );
    }


    await interaction.reply({
      content: '**Select a subreddit to remove:**',
      components: buttonRows,
    });
  },
};
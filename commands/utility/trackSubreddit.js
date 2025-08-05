const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { validateSubreddit, fetchSubredditSuggestions } = require('../../utils/redditAPI');
const { loadTrackedSubreddits, saveTrackedSubreddits } = require('../../utils/dataUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tracksubreddit')
    .setDescription('Track a subreddit')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Subreddit name (e.g., "dankmemes")')
        .setRequired(true)),
  async execute(interaction) {
    const subreddit = interaction.options.getString('name').toLowerCase();
    const trackedSubreddits = loadTrackedSubreddits();

    // 1. Ensure trackedSubreddits is an array
    if (!Array.isArray(trackedSubreddits)) {
      await interaction.reply('❌ Subreddit list corrupted. Resetting...');
      saveTrackedSubreddits([]);
      return;
    }

    // 2. Check if already tracked
    if (trackedSubreddits.includes(subreddit)) {
      return interaction.reply(`❌ r/${subreddit} is already tracked.`);
    }

    // 3. Validate subreddit
    const isValid = await validateSubreddit(subreddit);
    if (!isValid) {
      const suggestions = await fetchSubredditSuggestions(subreddit);
      if (suggestions.length === 0) {
        return interaction.reply('❌ Subreddit not found. No suggestions.');
      }
      const buttons = suggestions.slice(0, 3).map(suggestion =>
        new ButtonBuilder()
          .setCustomId(`track_${suggestion}`)
          .setLabel(`r/${suggestion}`)
          .setStyle(ButtonStyle.Primary)
      );
      return interaction.reply({
        content: `❌ r/${subreddit} doesn't exist. Try these:`,
        components: [new ActionRowBuilder().addComponents(buttons)],
      });
    }

    // 4. Save valid subreddit
    trackedSubreddits.push(subreddit);
    saveTrackedSubreddits(trackedSubreddits);
    await interaction.reply(`✅ Now tracking r/${subreddit}!`);
  },
};
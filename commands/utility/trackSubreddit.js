const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchSubredditSuggestions, validateSubreddit } = require('../../utils/redditAPI');
const { loadTrackedSubreddits, saveTrackedSubreddits } = require('../../utils/dataUtils');
const { validateSubreddit: validateInput } = require('../../utils/validateSubreddit');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tracksubreddit')
    .setDescription('Track a subreddit')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Subreddit name to track')
        .setRequired(true)),
  async execute(interaction) {
    const rawInput = interaction.options.getString('name').trim();
    const trackedSubreddits = loadTrackedSubreddits();

    // First validate the input format
    const inputValidation = await validateInput(rawInput);
    
    if (!inputValidation.isValid) {
      // If input is invalid (like "genshin impact"), get suggestions based on the raw input
      const suggestions = await fetchSubredditSuggestions(rawInput);
      
      if (suggestions.length === 0) {
        return interaction.reply(`❌ ${inputValidation.error}\n\nNo suggestions found for "${rawInput}".`);
      }

      const buttons = suggestions.slice(0, 3).map(suggestion =>
        new ButtonBuilder()
          .setCustomId(`track_${suggestion}`) 
          .setLabel(`r/${suggestion}`)
          .setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({
        content: `❌ ${inputValidation.error}\n\n**Did you mean one of these?**`,
        components: [new ActionRowBuilder().addComponents(buttons)],
      });
    }

    // Use the normalized subreddit name
    const inputSubreddit = inputValidation.normalized;

    // Check if already tracked (case-insensitive comparison for duplicates)
    const alreadyTracked = trackedSubreddits.find(sub => 
      sub.toLowerCase() === inputSubreddit.toLowerCase()
    );
    
    if (alreadyTracked) {
      return interaction.reply(`❌ r/${alreadyTracked} is already tracked.`);
    }

    // Validate subreddit exists on Reddit
    const isValid = await validateSubreddit(inputSubreddit);
    if (isValid) {
      trackedSubreddits.push(inputSubreddit);
      saveTrackedSubreddits(trackedSubreddits);
      return interaction.reply(`✅ Now tracking r/${inputSubreddit}!`);
    }

    // Get suggestions if subreddit doesn't exist
    const suggestions = await fetchSubredditSuggestions(inputSubreddit);
    if (suggestions.length === 0) {
      return interaction.reply('❌ Subreddit not found. No suggestions available.');
    }

    const buttons = suggestions.slice(0, 3).map(suggestion =>
      new ButtonBuilder()
        .setCustomId(`track_${suggestion}`) 
        .setLabel(`r/${suggestion}`)
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: `❌ r/${inputSubreddit} not found. Try these:`,
      components: [new ActionRowBuilder().addComponents(buttons)],
    });
  },
};
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botstatus')
    .setDescription('Check bot status and notification statistics'),
  async execute(interaction) {
    // This is handled in index.js for access to notificationPoller
    // Placeholder since the actual logic is in index.js
  },
};
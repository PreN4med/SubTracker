const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadTrackedSubreddits } = require('../../utils/dataUtils');
const { enableNotifications, disableNotifications, loadNotificationSettings } = require('../../utils/notificationUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('notifications')
    .setDescription('Manage live Reddit post notifications')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(subcommand =>
      subcommand.setName('enable')
        .setDescription('Enable notifications for a subreddit in this channel')
        .addStringOption(option =>
          option.setName('subreddit')
            .setDescription('Subreddit to get notifications from')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('min_upvotes')
            .setDescription('Minimum upvotes required to send notification (default: 10)')
            .setMinValue(1)
            .setMaxValue(1000)
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('disable')
        .setDescription('Disable notifications for a subreddit in this channel')
        .addStringOption(option =>
          option.setName('subreddit')
            .setDescription('Subreddit to stop notifications from')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('List all active notifications in this channel'))
    .addSubcommand(subcommand =>
      subcommand.setName('test')
        .setDescription('Test notifications with the latest post from a subreddit')
        .addStringOption(option =>
          option.setName('subreddit')
            .setDescription('Subreddit to test with')
            .setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const channelId = interaction.channel.id;

    switch (subcommand) {
      case 'enable':
        await handleEnable(interaction, guildId, channelId);
        break;
      case 'disable':
        await handleDisable(interaction, guildId, channelId);
        break;
      case 'list':
        await handleList(interaction, guildId, channelId);
        break;
      case 'test':
        await handleTest(interaction);
        break;
    }
  }
};

async function handleEnable(interaction, guildId, channelId) {
  const subreddit = interaction.options.getString('subreddit').toLowerCase().replace(/^r\//, '');
  const minUpvotes = interaction.options.getInteger('min_upvotes') || 10;
  const trackedSubreddits = loadTrackedSubreddits();

  // Check if subreddit is tracked
  if (!trackedSubreddits.some(sub => sub.toLowerCase() === subreddit.toLowerCase())) {
    return interaction.reply({
      content: `❌ r/${subreddit} is not tracked yet. Use \`/tracksubreddit\` first!`,
      ephemeral: true
    });
  }

  // Enable notifications
  const success = enableNotifications(guildId, channelId, subreddit, minUpvotes);
  
  if (success) {
    await interaction.reply({
      content: `✅ Enabled live notifications for **r/${subreddit}** in this channel!\n` +
               `📊 Minimum upvotes: **${minUpvotes}**\n` +
               `📡 Posts will appear here when they meet the criteria.`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ Failed to enable notifications for r/${subreddit}.`,
      ephemeral: true
    });
  }
}

async function handleDisable(interaction, guildId, channelId) {
  const subreddit = interaction.options.getString('subreddit').toLowerCase().replace(/^r\//, '');
  
  const success = disableNotifications(guildId, channelId, subreddit);
  
  if (success) {
    await interaction.reply({
      content: `✅ Disabled notifications for **r/${subreddit}** in this channel.`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ No active notifications found for r/${subreddit} in this channel.`,
      ephemeral: true
    });
  }
}

async function handleList(interaction, guildId, channelId) {
  const settings = loadNotificationSettings();
  const channelSettings = settings[guildId]?.[channelId];

  if (!channelSettings || Object.keys(channelSettings).length === 0) {
    return interaction.reply({
      content: '📭 No active notifications in this channel.\nUse `/notifications enable` to set some up!',
      ephemeral: true
    });
  }

  const notificationList = Object.entries(channelSettings)
    .map(([subreddit, config]) => 
      `• **r/${subreddit}** - Min upvotes: ${config.minUpvotes} 📈`
    )
    .join('\n');

  await interaction.reply({
    content: `📡 **Active Notifications in this channel:**\n${notificationList}`,
    ephemeral: true
  });
}

async function handleTest(interaction) {
  const subreddit = interaction.options.getString('subreddit').toLowerCase().replace(/^r\//, '');
  const { fetchPosts } = require('../../utils/redditAPI');
  const { createPostEmbed } = require('../../utils/notificationUtils');

  try {
    const posts = await fetchPosts(subreddit, 'hot');
    
    if (posts.length === 0) {
      return interaction.reply({
        content: `❌ No posts found in r/${subreddit}.`,
        ephemeral: true
      });
    }

    const testPost = posts[0].data;
    const embed = createPostEmbed(testPost);

    await interaction.reply({
      content: `🧪 **Test notification for r/${subreddit}:**`,
      embeds: [embed],
      ephemeral: true
    });
  } catch (error) {
    console.error('Test notification error:', error);
    await interaction.reply({
      content: `❌ Failed to fetch test post from r/${subreddit}.`,
      ephemeral: true
    });
  }
}
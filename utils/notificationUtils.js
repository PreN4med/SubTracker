const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const NOTIFICATIONS_PATH = path.join(__dirname, '../data/notifications.json');
const LAST_POSTS_PATH = path.join(__dirname, '../data/lastPosts.json');

// Load notification settings
function loadNotificationSettings() {
  try {
    if (!fs.existsSync(NOTIFICATIONS_PATH)) {
      fs.writeFileSync(NOTIFICATIONS_PATH, '{}');
      return {};
    }
    const data = fs.readFileSync(NOTIFICATIONS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading notification settings:', error);
    return {};
  }
}

// Save notification settings
function saveNotificationSettings(settings) {
  try {
    fs.writeFileSync(NOTIFICATIONS_PATH, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
}

// Load last post timestamps to avoid duplicates
function loadLastPosts() {
  try {
    if (!fs.existsSync(LAST_POSTS_PATH)) {
      fs.writeFileSync(LAST_POSTS_PATH, '{}');
      return {};
    }
    const data = fs.readFileSync(LAST_POSTS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading last posts:', error);
    return {};
  }
}

// Save last post timestamps
function saveLastPosts(lastPosts) {
  try {
    fs.writeFileSync(LAST_POSTS_PATH, JSON.stringify(lastPosts, null, 2));
  } catch (error) {
    console.error('Error saving last posts:', error);
  }
}

// Enable notifications for a channel
function enableNotifications(guildId, channelId, subreddit, minUpvotes = 10) {
  const settings = loadNotificationSettings();
  
  if (!settings[guildId]) {
    settings[guildId] = {};
  }
  
  if (!settings[guildId][channelId]) {
    settings[guildId][channelId] = {};
  }
  
  settings[guildId][channelId][subreddit] = {
    enabled: true,
    minUpvotes: minUpvotes,
    enabledAt: Date.now()
  };
  
  saveNotificationSettings(settings);
  return true;
}

// Disable notifications for a channel
function disableNotifications(guildId, channelId, subreddit) {
  const settings = loadNotificationSettings();
  
  if (settings[guildId] && settings[guildId][channelId] && settings[guildId][channelId][subreddit]) {
    delete settings[guildId][channelId][subreddit];
    
    if (Object.keys(settings[guildId][channelId]).length === 0) {
      delete settings[guildId][channelId];
    }
    if (Object.keys(settings[guildId]).length === 0) {
      delete settings[guildId];
    }
    
    saveNotificationSettings(settings);
    return true;
  }
  
  return false;
}

// Create embed for Reddit post
function createPostEmbed(post) {
  const embed = new EmbedBuilder()
    .setTitle(post.title.length > 256 ? post.title.substring(0, 253) + '...' : post.title)
    .setURL(`https://reddit.com${post.permalink}`)
    .setAuthor({ 
      name: `u/${post.author}`,
      url: `https://reddit.com/u/${post.author}`
    })
    .addFields(
      { name: '📈 Upvotes', value: post.ups.toString(), inline: true },
      { name: '💬 Comments', value: post.num_comments.toString(), inline: true },
      { name: '📊 Upvote Ratio', value: `${Math.round(post.upvote_ratio * 100)}%`, inline: true }
    )
    .setTimestamp(new Date(post.created_utc * 1000))
    .setColor(0xFF4500)
    .setFooter({ text: `r/${post.subreddit}` });

  // Add post flair if it exists
  if (post.link_flair_text) {
    embed.addFields({ name: '🏷️ Flair', value: post.link_flair_text, inline: true });
  }

  // Add description if it's a text post
  if (post.selftext && post.selftext.length > 0) {
    const description = post.selftext.length > 300 ? post.selftext.substring(0, 297) + '...' : post.selftext;
    embed.setDescription(description);
  }

  // Add thumbnail for image/video posts
  if (post.thumbnail && post.thumbnail.startsWith('http')) {
    embed.setThumbnail(post.thumbnail);
  }

  // Add image for direct image posts
  if (post.url && (post.url.includes('.jpg') || post.url.includes('.png') || post.url.includes('.gif'))) {
    embed.setImage(post.url);
  }

  return embed;
}

// Get time ago string
function getTimeAgo(timestamp) {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

module.exports = {
  loadNotificationSettings,
  saveNotificationSettings,
  loadLastPosts,
  saveLastPosts,
  enableNotifications,
  disableNotifications,
  createPostEmbed,
  getTimeAgo
};
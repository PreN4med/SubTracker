const { fetchPosts } = require('./redditAPI');
const { 
  loadNotificationSettings, 
  loadLastPosts, 
  saveLastPosts,
  createPostEmbed 
} = require('./notificationUtils');

class NotificationPoller {
  constructor(client) {
    this.client = client;
    this.isPolling = false;
    this.pollInterval = 2 * 60 * 1000;    
    this.maxPostAge = 10 * 60; 
  }

  start() {
    if (this.isPolling) return;
    
    console.log('🔔 Starting Reddit notification poller...');
    this.isPolling = true;
    this.poll();
    this.intervalId = setInterval(() => this.poll(), this.pollInterval);
  }

  stop() {
    if (!this.isPolling) return;
    
    console.log('🔕 Stopping Reddit notification poller...');
    this.isPolling = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async poll() {
    try {
      const settings = loadNotificationSettings();
      const lastPosts = loadLastPosts();
      let hasNewPosts = false;

      // Process for the server
      for (const [guildId, guildSettings] of Object.entries(settings)) {
        // Process the channels in the server
        for (const [channelId, channelSettings] of Object.entries(guildSettings)) {
          // Process each subreddit in the channel
          for (const [subreddit, config] of Object.entries(channelSettings)) {
            if (!config.enabled) continue;

            try {
              const hadNewPosts = await this.checkSubredditForNewPosts(
                guildId, 
                channelId, 
                subreddit, 
                config, 
                lastPosts
              );
              if (hadNewPosts) {
                hasNewPosts = true;
              }
            } catch (error) {
              console.error(`Error checking r/${subreddit} for guild ${guildId}:`, error.message);
            }
          }
        }
      }

      // Save updated last post timestamps
      if (hasNewPosts) {
        saveLastPosts(lastPosts);
      }

    } catch (error) {
      console.error('Error in notification polling:', error);
    }
  }

  async checkSubredditForNewPosts(guildId, channelId, subreddit, config, lastPosts) {
    const posts = await fetchPosts(subreddit, 'new');
    
    if (posts.length === 0) return false;

    const channel = await this.client.channels.fetch(channelId).catch(() => null);
    if (!channel) {
      console.log(`Channel ${channelId} not found, skipping notifications`);
      return false;
    }

    const subredditKey = `${guildId}_${channelId}_${subreddit}`;
    const lastPostTime = lastPosts[subredditKey] || config.enabledAt / 1000;
    const currentTime = Math.floor(Date.now() / 1000);
    let sentNotification = false;

    for (const postWrapper of posts) {
      const post = postWrapper.data;
      
      // Skip if post is older than our last check
      if (post.created_utc <= lastPostTime) continue;
      
      // Skip if post is too old (avoid spam when bot restarts)
      if (currentTime - post.created_utc > this.maxPostAge) continue;
      
      // Skip if post doesn't meet upvote threshold
      if (post.ups < config.minUpvotes) continue;
      
      // Skip if post is deleted/removed
      if (post.removed_by_category || post.author === '[deleted]') continue;

      try {
        await this.sendNotification(channel, post, subreddit);
        console.log(`📡 Sent notification for r/${subreddit}: "${post.title}"`);
        sentNotification = true;
      } catch (error) {
        console.error(`Error sending notification to ${channelId}:`, error.message);
      }
    }

    // Update last post timestamp for this subreddit
    if (posts.length > 0) {
      const latestPost = posts[0].data;
      lastPosts[subredditKey] = Math.max(lastPostTime, latestPost.created_utc);
    }

    return sentNotification;
  }

  async sendNotification(channel, post, subreddit) {
    const embed = createPostEmbed(post);
    
    // Add notification indicator
    embed.setAuthor({ 
      name: `🔔 New post in r/${subreddit}`,
      iconURL: 'https://www.redditstatic.com/desktop2x/img/favicon/favicon-96x96.png'
    });

    await channel.send({ embeds: [embed] });
  }

  getStatus() {
    const settings = loadNotificationSettings();
    let totalNotifications = 0;
    let totalChannels = 0;
    let totalGuilds = Object.keys(settings).length;

    for (const guildSettings of Object.values(settings)) {
      totalChannels += Object.keys(guildSettings).length;
      for (const channelSettings of Object.values(guildSettings)) {
        totalNotifications += Object.keys(channelSettings).length;
      }
    }

    return {
      isPolling: this.isPolling,
      totalGuilds,
      totalChannels,
      totalNotifications,
      pollInterval: this.pollInterval / 1000 / 60 // in minutes
    };
  }
}

module.exports = NotificationPoller;
const axios = require('axios');

// Validate if a subreddit exists and is public
async function validateSubreddit(subreddit) {
  try {
    const response = await axios.get(`https://www.reddit.com/r/${subreddit}/about.json`);
    // Check if the subreddit exists and is accessible
    const data = response.data?.data;
    return data && !data.over18 && data.display_name; // Return true if valid and accessible
  } catch (error) {
    // If we get a 404 or other error, the subreddit doesn't exist or isn't accessible
    return false;
  }
}

// Fetch similar subreddits for suggestions
async function fetchSubredditSuggestions(query) {
  try {
    const response = await axios.get(`https://www.reddit.com/subreddits/search.json?q=${query}&limit=10`);
    return response.data.data.children
      .map(sub => sub.data.display_name)
      .filter(name => name.toLowerCase().includes(query.toLowerCase())); // Better matching
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
}

// Fetch posts from a subreddit
async function fetchPosts(subreddit, filter) {
  try {
    const response = await axios.get(`https://www.reddit.com/r/${subreddit}/${filter}.json?limit=5`);
    return response.data.data.children;
  } catch (error) {
    console.error(`Error fetching ${filter} posts:`, error);
    return [];
  }
}

module.exports = { validateSubreddit, fetchSubredditSuggestions, fetchPosts };
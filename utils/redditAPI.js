const axios = require('axios');

// Validate if a subreddit exists and is public
async function validateSubreddit(subreddit) {
  try {
    const response = await axios.get(`https://www.reddit.com/r/${subreddit}/about.json`);
    return response.data?.data?.display_name === subreddit; // TRUE only if valid
  } catch (error) {
    return false; // Invalid subreddit
  }
}

// Fetch similar subreddits for suggestions
async function fetchSubredditSuggestions(query) {
  try {
    const response = await axios.get(`https://www.reddit.com/subreddits/search.json?q=${query}`);
    return response.data.data.children.map(sub => sub.data.display_name);
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
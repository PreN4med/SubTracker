const axios = require('axios');

async function fetchSubredditSuggestions(query) {
  try {
    const response = await axios.get(`https://www.reddit.com/subreddits/search.json?q=${query}`);
    return response.data.data.children.map(sub => sub.data.display_name);
  } catch (error) {
    console.error('Error fetching subreddit suggestions:', error);
    return [];
  }
}

async function fetchPosts(subreddit, filter) {
  try {
    const response = await axios.get(`https://www.reddit.com/r/${subreddit}/${filter}.json?limit=5`);
    return response.data.data.children;
  } catch (error) {
    console.error(`Error fetching ${filter} posts from r/${subreddit}:`, error);
    return [];
  }
}

module.exports = { fetchSubredditSuggestions, fetchPosts };
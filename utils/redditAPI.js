const axios = require('axios');

// Function to fetch subreddit suggestions
async function fetchSubredditSuggestions(query) {
    try {
        const response = await axios.get(`https://www.reddit.com/api/subreddit_autocomplete.json?query=${query}`);
        return response.data.subreddits.map(sub => sub.name);
    } catch (error) {
        console.error('Error fetching subreddit suggestions:', error);
        return [];
    }
}

// Function to fetch the latest post from a subreddit
async function fetchLatestPost(subreddit) {
    try {
        const response = await axios.get(`https://www.reddit.com/r/${subreddit}/new.json?limit=1`);
        if (response.data.data.children.length > 0) {
            return response.data.data.children[0].data;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching latest post from r/${subreddit}:`, error);
        return null;
    }
}

module.exports = { fetchSubredditSuggestions, fetchLatestPost };
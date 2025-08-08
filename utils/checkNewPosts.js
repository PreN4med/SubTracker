const axios = require('axios');

// Function to fetch the latest post from a specific subreddit
async function fetchLatestPost(subreddit) {
    try {
        // Make a request to Reddit's JSON API for the latest post in the subreddit
        const response = await axios.get(`https://www.reddit.com/r/${subreddit}/new.json?limit=1`);
        
        // Reddit returns a list of posts
        const post = response.data.data.children[0].data;

        return {
            title: post.title,
            url: `https://reddit.com${post.permalink}`,
            author: post.author,
            created_utc: post.created_utc,
        };
    } catch (error) {
        console.error(`Error fetching latest post from /r/${subreddit}:`, error.message);
        return null;
    }
}

module.exports = { fetchLatestPost };

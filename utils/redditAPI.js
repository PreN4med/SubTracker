const axios = require('axios');

// Add this function
async function fetchLatestPost(subreddit) {
    try {
        const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=1`;
        const response = await axios.get(url);
        if (response.data?.data?.children?.length > 0) {
            const latestPost = response.data.data.children[0].data;
            return {
                title: latestPost.title,
                author: latestPost.author,
                url: `https://www.reddit.com${latestPost.permalink}`
            };
        }
        return null;
    } catch (error) {
        console.error(`Error fetching latest post from /r/${subreddit}:`, error);
        return null;
    }
}

// Update exports
module.exports = { fetchSubredditSuggestions, fetchLatestPost };
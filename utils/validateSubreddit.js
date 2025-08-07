const { fetchSubredditSuggestions } = require('./redditAPI'); 

async function validateSubreddit(input) {
    const subreddit = input.replace(/^\/?r\//, '').trim();

    // Check if it contains invalid characters (spaces, special chars except underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(subreddit)) {
        return {
            isValid: false,
            error: `"${input}" is not a valid subreddit name. Subreddit names can only contain letters, numbers, and underscores (no spaces or special characters).`,
            normalized: null
        };
    }

    return { 
        isValid: true, 
        normalized: subreddit,
        error: null
    };
}

module.exports = { validateSubreddit };
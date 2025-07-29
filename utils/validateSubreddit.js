const { fetchSubredditSuggestions } = require('./redditAPI'); 

async function validateSubreddit(input) {
    const subreddit = input.replace(/^\/?r\//, '').trim().toLowerCase();

    if (!/^[a-z0-9_]+$/.test(subreddit)) {
        const suggestions = await fetchSubredditSuggestions(subreddit);
        return {
            isValid: false,
            error: `"${input}" is not a valid subreddit name. Only letters, numbers, and underscores are allowed.`,
            suggestions: suggestions.slice(0, 3), 
        };
    }

    return { isValid: true, normalized: subreddit };
}

module.exports = { validateSubreddit };
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
    // Create multiple search variations
    const cleanQuery = query.replace(/[^a-zA-Z0-9]/g, '');
    const underscoreQuery = query.replace(/\s+/g, '_');
    const searchQueries = [
      query,                    
      underscoreQuery,           
      cleanQuery              
    ];

    // Collect suggestions from all search variations
    const allSuggestions = new Set();
    
    for (const searchQuery of searchQueries) {
      try {
        const response = await axios.get(`https://www.reddit.com/subreddits/search.json?q=${encodeURIComponent(searchQuery)}&limit=20`);
        response.data.data.children.forEach(sub => {
          allSuggestions.add(sub.data.display_name);
        });
      } catch (err) {
        // Continue with other queries if one fails
        console.log(`Search failed for "${searchQuery}":`, err.message);
      }
    }

    // Convert to array and rank by relevance
    const suggestions = Array.from(allSuggestions);
    const lowerQuery = query.toLowerCase();
    const lowerUnderscoreQuery = underscoreQuery.toLowerCase();
    const lowerCleanQuery = cleanQuery.toLowerCase();

    // Sort by relevance (most relevant first)
    const rankedSuggestions = suggestions.sort((a, b) => {
      const lowerA = a.toLowerCase();
      const lowerB = b.toLowerCase();

      // Exact matches get highest priority
      if (lowerA === lowerQuery || lowerA === lowerUnderscoreQuery || lowerA === lowerCleanQuery) return -1;
      if (lowerB === lowerQuery || lowerB === lowerUnderscoreQuery || lowerB === lowerCleanQuery) return 1;

      // Starts with query variations
      const aStartsWithQuery = lowerA.startsWith(lowerQuery) || lowerA.startsWith(lowerUnderscoreQuery) || lowerA.startsWith(lowerCleanQuery);
      const bStartsWithQuery = lowerB.startsWith(lowerQuery) || lowerB.startsWith(lowerUnderscoreQuery) || lowerB.startsWith(lowerCleanQuery);
      
      if (aStartsWithQuery && !bStartsWithQuery) return -1;
      if (!aStartsWithQuery && bStartsWithQuery) return 1;

      // Contains query variations (shorter names preferred)
      const aContainsQuery = lowerA.includes(lowerQuery) || lowerA.includes(lowerUnderscoreQuery) || lowerA.includes(lowerCleanQuery);
      const bContainsQuery = lowerB.includes(lowerQuery) || lowerB.includes(lowerUnderscoreQuery) || lowerB.includes(lowerCleanQuery);
      
      if (aContainsQuery && !bContainsQuery) return -1;
      if (!aContainsQuery && bContainsQuery) return 1;
      
      // If both contain query, prefer shorter names
      if (aContainsQuery && bContainsQuery) {
        return a.length - b.length;
      }

      // Default alphabetical
      return a.localeCompare(b);
    });

    // Filter to only relevant results and return top 5
    const relevantSuggestions = rankedSuggestions.filter(name => {
      const lowerName = name.toLowerCase();
      return lowerName.includes(lowerQuery) || 
             lowerName.includes(lowerUnderscoreQuery) || 
             lowerName.includes(lowerCleanQuery) ||
             lowerQuery.includes(lowerName.replace(/_/g, ' ')) ||
             lowerCleanQuery.includes(lowerName.replace(/_/g, ''));
    });

    return relevantSuggestions.slice(0, 5);
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
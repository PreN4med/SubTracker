const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/subreddits.json');

// Load tracked subreddits from JSON file
function loadTrackedSubreddits() {
    try {
        if (fs.existsSync(DATA_PATH)) {
            const fileContents = fs.readFileSync(DATA_PATH, 'utf8');
            return JSON.parse(fileContents);
        }
    } catch (error) {
        console.error('Error loading tracked subreddits:', error.message);
    }
    return { trackedSubreddits: [] }; // Default if file doesn't exist or is invalid
}

// Save tracked subreddits to JSON file
function saveTrackedSubreddits(data) {
    try {
        // Create data directory if it doesn't exist
        if (!fs.existsSync(path.dirname(DATA_PATH))) {
            fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
        }
        
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
        console.log('Tracked subreddits saved successfully.');
    } catch (error) {
        console.error('Error saving tracked subreddits:', error.message);
    }
}

module.exports = {
    loadTrackedSubreddits,
    saveTrackedSubreddits
};
const fs = require('fs');
const path = require('path');
const SUBREDDITS_PATH = path.join(__dirname, '../data/subreddits.json');

function loadTrackedSubreddits() {
  try {
    if (!fs.existsSync(SUBREDDITS_PATH)) {
      fs.writeFileSync(SUBREDDITS_PATH, '[]'); // Create file if missing
      return [];
    }
    const data = fs.readFileSync(SUBREDDITS_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : []; // Force array
  } catch (error) {
    console.error('Error loading subreddits:', error);
    return []; // Fallback to empty array
  }
}

function saveTrackedSubreddits(subreddits) {
  if (!Array.isArray(subreddits)) {
    console.error('Attempted to save non-array:', subreddits);
    subreddits = []; // Reset to empty array
  }
  fs.writeFileSync(SUBREDDITS_PATH, JSON.stringify(subreddits, null, 2));
}

module.exports = { loadTrackedSubreddits, saveTrackedSubreddits };
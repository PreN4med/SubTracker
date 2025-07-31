const fs = require('fs');
const path = require('path');
const SUBREDDITS_PATH = path.join(__dirname, '../data/subreddits.json'); 

function loadTrackedSubreddits() {
  if (!fs.existsSync(SUBREDDITS_PATH)) {
    fs.writeFileSync(SUBREDDITS_PATH, '[]', 'utf-8'); 
    return [];
  }
  return JSON.parse(fs.readFileSync(SUBREDDITS_PATH, 'utf-8'));
}

function saveTrackedSubreddits(subreddits) {
  fs.writeFileSync(SUBREDDITS_PATH, JSON.stringify(subreddits, null, 2), 'utf-8');
}

module.exports = { loadTrackedSubreddits, saveTrackedSubreddits };
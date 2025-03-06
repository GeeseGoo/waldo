const fs = require('fs');
const path = require('path');

// Path to db.json
const dbPath = path.join(__dirname, 'db.json');

// Check if db.json exists, if not create it with default structure
if (!fs.existsSync(dbPath)) {
  const defaultDb = {
    maps: {
      waldo: {
        characters: {
          waldo: {
            x: 1588,
            y: 631
          }
        }
      },
      michaels: {
        characters: {
          bigguy: {
            x: 423,
            y: 386
          },
          littleman: {
            x: 657,
            y: 498
          },
          rat: {
            x: 892,
            y: 732
          }
        }
      },
      roberts: {
        characters: {
          robertears: {
            x: 321,
            y: 486
          },
          roberttoes: {
            x: 578,
            y: 612
          },
          roberteyes: {
            x: 834,
            y: 324
          }
        }
      }
    },
    highScores: {},
    sessions: {}
  };
  
  fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
}

// Load the database
let db;
try {
  const data = fs.readFileSync(dbPath, 'utf8');
  db = JSON.parse(data);
  
  // Ensure all required structures exist
  if (!db.maps) db.maps = {};
  if (!db.highScores) db.highScores = {};
  if (!db.sessions) db.sessions = {};
} catch (error) {
  console.error('Error loading database:', error);
  // Create a new db if there was an error
  db = {
    maps: {},
    highScores: {},
    sessions: {}
  };
}

module.exports = db;

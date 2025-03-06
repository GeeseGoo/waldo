var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const fs = require('fs');
const db = require('./db');
const { v4: uuidv4 } = require('uuid');
const uuid = uuidv4;
const cors = require('cors');
require('dotenv').config();

var app = express();

// Initialize highScores in DB if it doesn't exist
if (!db.highScores) {
  db.highScores = {};
  save();
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Enable CORS for all routes with more specific configuration
app.use(cors({
  origin: true, // Allow all origins
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add preflight OPTIONS handling
app.options('*', cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/characterCoords/:id', function(req, res) {
  const id = req.params.id;
  const coords = db.coords[id];
  res.json({ x: coords.x, y: coords.y });
});

app.post('/submitAnswer/:charId', function(req, res) {
  const id = req.params.charId;
  const { x, y, sessionId } = req.body;

  const radius = 50;
  const session = db.sessions[sessionId];
  
  if (!session) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  const map = db.maps[session.map];
  const coords = map.characters[id];

  console.log('checking', id, coords, x, y);

  if (Math.abs(coords.x - x) < radius && Math.abs(coords.y - y) < radius) {
    console.log('submit answer in session', sessionId);
    session.characters[id] = true;
    save();
    if (Object.values(session.characters).every(Boolean)) {
      return res.json({ success: true, complete: true });
    }
    return res.json({ success: true, complete: false });
  }
  else {
    return res.json({ success: false, complete: false });
  }
});

app.get('/maps/:id', function(req, res) {
  const id = req.params.id;
  const map = db.maps[id];
  res.json(map);
});

app.post('/maps/:id', function(req, res) {
  const id = req.params.id;
  db.maps[id] = req.body;
  save();
  res.json({ success: true });
});

app.post('/game/start/:mapId', function(req, res) {
  const sessionId = uuid();
  const startTime = Date.now();
  const mapId = req.params.mapId;
  const map = db.maps[mapId];
  const characters = Object.keys(map.characters);
  
  // Create a map of characters with initial status of false (not found)
  const charactersStatus = {};
  characters.forEach(character => {
    charactersStatus[character] = false;
  });

  console.log('starting game with characters', characters);
  
  db.sessions[sessionId] = { 
    startTime,
    endTime: null,
    isActive: true,
    characters: charactersStatus, // Add characters property with initial status
    map: mapId,
    id: sessionId
  };

  save();

  res.json({ session: db.sessions[sessionId] });
});

app.post('/game/:id/end', function(req, res) {
  const sessionId = req.params.id;
  const endTime = Date.now();
  
  // Update the session
  if (!db.sessions[sessionId]) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }
  
  db.sessions[sessionId].endTime = endTime;
  db.sessions[sessionId].isActive = false;

  // Calculate elapsed time
  const elapsedTime = endTime - db.sessions[sessionId].startTime;
  const mapId = db.sessions[sessionId].map;
  
  // Check if this is a high score
  let isHighScore = false;
  
  if (!db.highScores[mapId] || elapsedTime < db.highScores[mapId].time) {
    isHighScore = true;
  }

  save();

  res.json({ elapsedTime, isHighScore });
});

// Get all high scores
app.get('/highscores', function(req, res) {
  res.json(db.highScores || {});
});

// Submit a new high score
app.post('/highscores', function(req, res) {
  const { mapId, name, time, sessionId } = req.body;
  
  if (!mapId || !name || !time) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }
  
  // Only update if this is actually a high score
  if (!db.highScores[mapId] || time < db.highScores[mapId].time) {
    db.highScores[mapId] = {
      name,
      time,
      date: Date.now(),
      sessionId
    };
    save();
    return res.json({ success: true });
  }
  
  return res.json({ success: false, message: "Not a high score" });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const save = () => {
  fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
};

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;


import { useEffect, useState, useContext } from 'react'
import {SessionContext} from './sessionContext'
import './App.css'
import waldoImg from "./assets/waldo1.png";
import bigguyImg from "./assets/op1.png";
import littlemanImg from "./assets/op2.png";
import ratImg from "./assets/op3.png";
import PlantLadyImg from "./assets/league1.png";
import kiddoImg from "./assets/league2.png";
import snekImg from "./assets/league3.png";

function App() {
  const [selectedMap, setSelectedMap] = useState(null);
  
  const startGame = (map) => {
    setSelectedMap(map);
  };
  
  // Show the game if a map is selected, otherwise show the menu
  return (
    <>
      {selectedMap ? (
        <GameImage mapId={selectedMap.id} mapImg={selectedMap.image} onBack={() => setSelectedMap(null)} />
      ) : (
        <MainMenu onMapSelect={startGame} />
      )}
    </>
  );
}

function MainMenu({ onMapSelect }) {
  const [highScores, setHighScores] = useState({});
  
  // Fetch high scores when component mounts
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BASE_URL}/highscores`)
      .then(response => response.json())
      .then(data => {
        setHighScores(data);
      })
      .catch(error => {
        console.error('Error fetching high scores:', error);
      });
  }, []);
  
  // Updated map images to use assets
  const maps = [
    { id: 'waldo', name: "Classic Waldo", image: "https://i.redd.it/cetpwklahlq61.jpg" },
    { id: 'roberts', name: "League Of Legends", image: "https://i.imgur.com/91z9w5T.jpg" },
    { id: 'michaels', name: "One Piece", image: "https://i.redd.it/iexleqhe0jb71.png" }
  ];
  
  return (
    <div className="main-menu">
      <h1 className="menu-title">Where's Waldo?</h1>
      <p className="menu-instructions">
        Welcome to Where's Waldo! Select a map and find all the hidden characters. Right-click to make a guess when you spot someone. Can you find them all and set a new high score?
      </p>
      
      <div className="map-grid">
        {maps.map(map => (
          <div className="map-card" key={map.id} onClick={() => onMapSelect(map)}>
            <div className="map-thumbnail">
              <img src={map.image} alt={map.name} />
            </div>
            <div className="map-name">{map.name}</div>
            {highScores[map.id] && (
              <div className="high-score">
                Best: {highScores[map.id].name} - {formatTime(highScores[map.id].time)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to format time in minutes and seconds
function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function GameImage({mapId, onBack, mapImg}) {
  const [sessionData, setSessionData] = useState(null);
  const [foundCharacters, setFoundCharacters] = useState({});
  const [answerActive, setAnswerActive] = useState(false);
  const [answerPosition, setAnswerPosition] = useState({ x: 0, y: 0 });
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [foundMarkers, setFoundMarkers] = useState([]);
  const [scale, setScale] = useState(1.2); // Increased initial scale from 1 to 1.2
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPosition, setStartPanPosition] = useState({ x: 0, y: 0 });
  const [showHighScoreForm, setShowHighScoreForm] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [completionTime, setCompletionTime] = useState(null);
  const [isHighScore, setIsHighScore] = useState(false);
  const [selectedCharacterImage, setSelectedCharacterImage] = useState(null);

  useEffect(() => {
    fetch(import.meta.env.VITE_BASE_URL + '/game/start/' + mapId, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        console.log("Full server response:", JSON.stringify(data, null, 2));
        
        // Extract session data properly - keep the server-provided ID
        let sessionWithId;
        
        if (data.session && data.session.id) {
          // The ID is inside the session object - this is what's happening in your case
          sessionWithId = {...data.session};
          console.log("Using server-provided session ID:", sessionWithId.id);
        } else if (data.id) {
          sessionWithId = {...data};
        } else {
          // Fallback only if no ID exists anywhere
          sessionWithId = {...(data.session || data), id: `session_${Date.now()}`};
        }
        
        console.log("Session data being stored:", sessionWithId);
        setSessionData(sessionWithId);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }, [mapId]);

  // Function to handle successful answer submission
  const handleSuccessfulSubmission = (character, position) => {
    // Update found characters
    setFoundCharacters(prev => ({
      ...prev,
      [character]: true
    }));
    
    // Add marker to the map
    setFoundMarkers(prev => [...prev, {
      character,
      position,
      timestamp: Date.now()
    }]);
    
    // Close the answer selector
    setAnswerActive(false);
    
    // Show success feedback
    setFeedbackMessage(`You found ${character}!`);
    setTimeout(() => setFeedbackMessage(null), 2000);
    
    // Check if this was the last character - if all characters are now found
    const updatedFoundCharacters = {...foundCharacters, [character]: true};
    const allFound = Object.keys(sessionData.characters).every(char => updatedFoundCharacters[char]);
    
    if (allFound) {
      handleGameCompletion();
    }
  };
  
  // Function to handle game completion
  const handleGameCompletion = () => {
    setGameComplete(true);
    
    // End the game session
    fetch(`${import.meta.env.VITE_BASE_URL}/game/${sessionData.id}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      const { elapsedTime, isHighScore } = data;
      setCompletionTime(elapsedTime);
      setIsHighScore(isHighScore);
      
      setTimeout(() => {
        if (isHighScore) {
          setShowHighScoreForm(true);
        } else {
          alert(`Congratulations! You found all characters in ${formatTime(elapsedTime)}`);
        }
      }, 500);
    })
    .catch(error => {
      console.error('Error ending game:', error);
    });
  };

  // Function to submit high score
  const submitHighScore = (playerName) => {
    fetch(`${import.meta.env.VITE_BASE_URL}/highscores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mapId,
        name: playerName,
        time: completionTime,
        sessionId: sessionData.id
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        setShowHighScoreForm(false);
        alert(`Congratulations ${playerName}! Your high score has been recorded!`);
      }
    })
    .catch(error => {
      console.error('Error submitting high score:', error);
    });
  };

  // Function to handle error feedback
  const handleErrorFeedback = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 2000);
  };

  // Handler for zoom in/out buttons
  const handleZoom = (direction) => {
    setScale(prevScale => {
      const newScale = direction === 'in' 
        ? Math.min(prevScale + 0.2, 3) // Limit max zoom to 3x
        : Math.max(prevScale - 0.2, 0.5); // Limit min zoom to 0.5x
      return newScale;
    });
  };
  
  // Handler for mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    setScale(prevScale => {
      const newScale = Math.min(Math.max(prevScale + delta, 0.5), 3);
      return newScale;
    });
  };
  
  // Modified: Handlers for panning with LEFT mouse button now
  const handleMouseDown = (e) => {
    // Use left mouse button (button 0) for panning
    if (e.button === 0) { // Changed to left mouse button
      setIsPanning(true);
      setStartPanPosition({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };
  
  const handleMouseMove = (e) => {
    if (isPanning) {
      const newX = e.clientX - startPanPosition.x;
      const newY = e.clientY - startPanPosition.y;
      setPosition({ x: newX, y: newY });
    }
  };
  
  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Handle right-click for character selection
  const handleContextMenu = (e) => {
    e.preventDefault(); // Prevent the browser context menu
    
    // Don't handle selections if all characters are found
    if (availableCharacters.length === 0) {
      setFeedbackMessage("You found all characters!");
      setTimeout(() => setFeedbackMessage(null), 2000);
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Calculate the actual position on the original image considering zoom and pan
    const x = (e.clientX - rect.left - position.x) / scale;
    const y = (e.clientY - rect.top - position.y) / scale;
    
    console.log('answer at', x, y);
    setAnswerPosition({ x, y });
    setAnswerActive(true); // Always show selector on right-click
  };

  // Remove the handleGameClick function as we don't want left clicks to trigger the selector
  // Instead, we'll use a simple function to close the selector if it's open
  const handleImageClick = (e) => {
    if (answerActive) {
      setAnswerActive(false);
    }
  };

  // Don't render anything until we have session data
  if (!sessionData) {
    return <div className="loading">Loading game data...</div>;
  }

  // Get available characters (those not yet found)
  const availableCharacters = sessionData.characters ? 
    Object.keys(sessionData.characters).filter(char => !foundCharacters[char]) : 
    [];
    
  const allCharacters = sessionData.characters ? Object.keys(sessionData.characters) : [];

  // Define character images - map character names to image URLs
  // Import character images
  
  // Define character images mapping
  const characterImages = {
    waldo: waldoImg,
    bigguy: bigguyImg,
    littleman: littlemanImg,
    rat: ratImg,
    PlantLady: PlantLadyImg,
    kiddo: kiddoImg,
    snek: snekImg
  };

  return (
    <SessionContext.Provider value={{
      ...sessionData, 
      onSuccessfulSubmission: handleSuccessfulSubmission,
      onErrorFeedback: handleErrorFeedback
    }}>
      <div className="game-container">
        <button className="back-button" onClick={onBack}>Back to Menu</button>
        
        {/* Character Bar with images */}
        <CharacterBar 
          characters={allCharacters}
          foundCharacters={foundCharacters}
          characterImages={characterImages}
          onCharacterClick={(charImage) => setSelectedCharacterImage(charImage)}
        />
        
        {/* Zoom controls */}
        <div className="zoom-controls">
          <button onClick={() => handleZoom('in')} className="zoom-button">+</button>
          <div className="zoom-level">{Math.round(scale * 100)}%</div>
          <button onClick={() => handleZoom('out')} className="zoom-button">-</button>
        </div>
        
        {/* Feedback messages */}
        {feedbackMessage && 
          <div className="feedback-message success">
            {feedbackMessage}
          </div>
        }
        
        {errorMessage && 
          <div className="feedback-message error">
            {errorMessage}
          </div>
        }
        
        {/* Updated pan instructions */}
        <div className="pan-instructions">
          Left-click + drag to pan | Right-click to select | Scroll to zoom
        </div>
        
        {/* Game image with pan and zoom */}
        <div 
          className="game-viewport fullscreen"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={handleContextMenu}
        >
          <div 
            className="game-image" 
            onClick={handleImageClick} /* Changed from handleGameClick to handleImageClick */
            style={{ 
              transform: `scale(${scale}) translate(${position.x/scale}px, ${position.y/scale}px)`,
              cursor: isPanning ? 'grabbing' : 'grab'
            }}
          >
            {/* Render found markers */}
            {foundMarkers.map((marker, idx) => (
              <div 
                key={idx}
                className="found-marker"
                style={{ 
                  left: marker.position.x, 
                  top: marker.position.y,
                  transform: `translate(-50%, -50%) scale(${1/scale})`
                }}
              >
                <div className="marker-pulse"></div>
                <div className="marker-label" style={{ fontSize: `${12/scale}px` }}>
                  {marker.character}
                </div>
              </div>
            ))}
            
            {/* Answer selector - adjust for zoom */}
            {answerActive && sessionData && 
              <AnswerSelector 
                answers={availableCharacters}
                position={answerPosition}
                scale={scale}
                onClose={() => setAnswerActive(false)}
              />
            }
            <img
              src={mapImg}
              alt="Where's Waldo?"
              style={{ transformOrigin: 'top left' }}
              draggable="false"
            />
          </div>
        </div>
      </div>
      
      {/* Character Image Modal */}
      {selectedCharacterImage && (
        <div className="modal-overlay" onClick={() => setSelectedCharacterImage(null)}>
          <div className="modal-content character-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCharacterImage(null)}>×</button>
            <img src={selectedCharacterImage} alt="Character" className="character-modal-image" />
          </div>
        </div>
      )}
      
      {/* High Score Modal */}
      {showHighScoreForm && (
        <HighScoreForm 
          onSubmit={submitHighScore} 
          onCancel={() => setShowHighScoreForm(false)} 
          time={completionTime}
        />
      )}
    </SessionContext.Provider>
  );
}

// New component for high score form
function HighScoreForm({ onSubmit, onCancel, time }) {
  const [name, setName] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content high-score-form">
        <h2>New High Score!</h2>
        <p>You completed the game in {formatTime(time)}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="player-name">Enter your name:</label>
            <input
              type="text"
              id="player-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoFocus
              required
            />
          </div>
          
          <div className="form-buttons">
            <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
            <button type="submit" className="submit-button">Save Score</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Updated component for character bar with images
function CharacterBar({ characters, foundCharacters, characterImages, onCharacterClick }) {
  return (
    <div className="character-bar">
      <div className="character-list">
        {characters.map(character => (
          <div 
            key={character} 
            className={`character-item ${foundCharacters[character] ? 'found' : ''}`}
          >
            <div 
              className="character-image"
              onClick={() => onCharacterClick && characterImages[character] ? 
                onCharacterClick(characterImages[character]) : null}
              style={{ cursor: 'pointer' }} // Add pointer cursor to indicate clickability
            >
              {characterImages && characterImages[character] ? (
                <img 
                  src={characterImages[character]} 
                  alt={character} 
                />
              ) : (
                // Fallback if no image is available
                <div className="character-image-placeholder">
                  {character.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="character-name">{character}</div>
            {foundCharacters[character] && (
              <div className="character-found-icon">✓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnswerSelector({ answers, position, scale = 1, onClose }) {
  const sessionContext = useContext(SessionContext);
  
  // Don't show if no answers left
  if (answers.length === 0 || !sessionContext) {
    return null;
  }
  
  return (
    <div className="cursor-highlight" style={{ 
      top: position.y, 
      left: position.x,
      transform: `translate(-50%, -50%) scale(${1/scale})`, // Counter-scale the highlight
      width: `${100 / scale}px`,
      height: `${100 / scale}px`
    }}>
      <div className="answer-header">
      </div>
      <ul className="answer-list" style={{ transform: `translate(80%, -50%) scale(${1/scale})` }}>      

        {answers.map((character, index) => (
          <li key={index}>
            <button onClick={() => {
              submitAnswer(character, position, sessionContext);
              onClose(); // Close the selector after selecting an answer
            }}>
              {character}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function submitAnswer(character, position, session) {
  console.log("Full session object received in submitAnswer:", session);
  
  if (!session) {
    console.error("Session is null or undefined");
    return;
  }
  
  // Use the id property directly from the session object
  const sessionId = session.id;
  
  console.log("Session ID being used:", sessionId);
  
  if (!sessionId) {
    console.error("No session ID available in:", session);
    return;
  }
  
  // Use the correct endpoint URL - remove the "/game" prefix to match server route
  fetch(`${import.meta.env.VITE_BASE_URL}/submitAnswer/${character}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      x: position.x, 
      y: position.y, 
      sessionId: sessionId 
    })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      console.log("Submit response:", data);
      
      if (data.success) {
        // If answer was correct, notify parent component
        if (session.onSuccessfulSubmission) {
          session.onSuccessfulSubmission(character, position);
        }
      } else {
        // Wrong guess - show feedback message instead of alert
        if (session.onErrorFeedback) {
          session.onErrorFeedback(`That's not ${character}. Try again!`);
        }
      }
    })
    .catch(error => {
      console.error('Error submitting answer:', error);
      if (session.onErrorFeedback) {
        session.onErrorFeedback("Error submitting your answer. Please try again.");
      }
    });
}

export default App

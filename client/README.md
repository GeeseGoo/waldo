# Where's Waldo? Game

A modern web implementation of the classic Where's Waldo? game, built with React and Vite. Find hidden characters in various themed maps while competing for the fastest completion times!

## 🎮 How to Play

1. Select a map from the main menu
2. Find all the hidden characters in the image
3. Use the following controls:
   - Left-click + drag to pan around the image
   - Right-click to make a character selection
   - Mouse wheel to zoom in/out
4. Click on character portraits in the top bar to see larger versions
5. Try to find all characters as quickly as possible to set a new high score!

## 🚀 Features

- Multiple themed maps (Classic Waldo, League of Legends, One Piece)
- Interactive pan and zoom controls
- Real-time character tracking
- High score system
- Responsive design
- Visual feedback for found characters
- Character preview system

## 🛠️ Technical Stack

- **Frontend:**
  - React 19
  - Vite 6
  - CSS3 with modern animations
  - Context API for state management

- **Backend Dependencies:**
  - Express.js server
  - PostgreSQL database
  - Railway for deployment

## 🔧 Development Setup

1. Clone the repository
2. Install dependencies:
```bash
cd client
npm install
```

3. Set up environment variables:
Create a `.env` file in the client directory with:
```
VITE_BASE_URL=your_backend_url
```

4. Start development server:
```bash
npm run dev
```

## 📝 API Endpoints

- `POST /game/start/:mapId` - Start a new game session
- `POST /submitAnswer/:character` - Submit a character guess
- `POST /game/:sessionId/end` - End a game session
- `GET /highscores` - Retrieve high scores
- `POST /highscores` - Submit a new high score

## 🏗️ Project Structure

```
client/
├── src/
│   ├── assets/      # Character and game images
│   ├── components/  # React components
│   ├── App.jsx      # Main application component
│   ├── App.css      # Global styles
│   └── main.jsx     # Application entry point
└── public/          # Static assets
```



## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.




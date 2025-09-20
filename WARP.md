# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Tetroswap Web is a Phaser 3-based puzzle game where players swap colored boxes to create connected groups of 4+ matching colors. The game features 80 progressive levels stored as JSON configurations and includes features like undo functionality, progress tracking, and responsive design.

## Development Commands

### Core Development
```bash
# Install dependencies
npm install

# Start development server (auto-opens browser at http://localhost:3000)
npm run dev

# Start development server without auto-open
npm start

# Build for production (outputs to dist/ directory)
npm run build
```

### Testing Individual Levels
- Level files are located in `src/assets/levels/` numbered 1-80
- To test a specific level, modify the starting level in the game or use browser dev tools to call `window.game.scene.start('GameScene', { levelNumber: X })`
- The game automatically saves progress to localStorage

## Code Architecture

### Scene System (Phaser 3)
- **MenuScene** (`src/scenes/MenuScene.js`): Main menu with paginated level selection (20 levels per page)
- **GameScene** (`src/scenes/GameScene.js`): Core gameplay with UI overlay, completion dialogs, and game state management

### Game Logic Layer
- **GameData** (`src/game/GameData.js`): Singleton for level loading, progress persistence, and global game state
- **Level** (`src/game/Level.js`): Individual level logic including win conditions, move counting, and undo history
- **Grid** (`src/game/Grid.js`): Visual DOM-based grid system with drag-and-drop mechanics for swapping rows/columns
- **Box** (`src/game/Box.js`): Individual game pieces with color mapping (a-p letter codes to CSS colors)

### Hybrid Rendering Architecture
The game uses a unique hybrid approach:
- **Phaser 3** for scene management, background, and UI elements
- **DOM elements** for the game grid to enable complex drag-and-drop interactions
- **Coordinate mapping** between Phaser canvas space (1024x768) and DOM positioning

### Level Data Format
Levels are JSON files with this structure:
```json
{
  "tiles": [
    ["a", "b", "c"],  // Row 0: color codes
    ["b", "a", "c"]   // Row 1: a=blue, b=green, c=red, etc.
  ],
  "swaps": 3,         // Target moves for perfect completion
  "rows": 2,
  "cols": 3,
  "completed": false  // Runtime flag
}
```

### Game Mechanics
- **Objective**: Create connected groups of 4+ boxes of the same color
- **Controls**: Drag rows/columns to swap them entirely
- **Win condition**: All non-empty boxes must be part of groups of 4+ connected same-colored boxes
- **Scoring**: Track moves vs target moves for "perfect" completion

## Important Implementation Details

### DOM/Phaser Integration
The Grid class creates DOM elements positioned relative to the Phaser canvas. Key positioning logic is in `Grid.centerGridInCanvas()` - modify this when changing canvas dimensions or positioning.

### Progress System
- Progress stored in localStorage as 'tetroswap_progress'
- Levels unlock sequentially (must complete level N to unlock N+1)
- Current menu page stored as 'tetroswap_current_page'

### Level Loading
GameData uses dynamic imports to load all 80 levels asynchronously. Fallback levels are created if JSON files fail to load.

### Undo System
Each Level maintains up to 10 previous states for undo functionality. Grid state is deep-copied before each move.

### Color System
16 distinct colors mapped from single letters (a-p) to hex codes. See `BoxColorStyles` in `Box.js` for the complete mapping.

## File Structure

```
src/
├── main.js              # Phaser game initialization and config
├── scenes/
│   ├── MenuScene.js     # Level selection with 4x5 grid per page
│   └── GameScene.js     # Gameplay scene with hybrid DOM/Phaser UI
├── game/
│   ├── GameData.js      # Global state and level loading
│   ├── Level.js         # Individual level logic and validation  
│   ├── Grid.js          # DOM-based visual grid with drag mechanics
│   └── Box.js           # Game piece representation and colors
└── assets/
    └── levels/          # JSON level definitions (1.json through 80.json)
```

## Development Guidelines

When modifying this codebase:

- **Canvas positioning**: Always test DOM element positioning across different screen sizes
- **Level validation**: Ensure new levels have valid win conditions (all boxes can form groups of 4+)
- **Performance**: Level loading is async - handle loading states properly
- **Progress persistence**: Changes to GameData progress format may break existing saves
- **Cross-browser**: Test drag-and-drop on both mouse and touch devices

## Webpack Configuration

Uses webpack-dev-server on port 3000 with hot reloading. The build includes:
- JSON loader for level files
- Asset handling for images
- HTML template injection
- CSS processing via style-loader and css-loader
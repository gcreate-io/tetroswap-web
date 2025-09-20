# Tetroswap Web

A web-based version of the Tetroswap puzzle game built with Phaser 3 and modern web technologies.

## About

Tetroswap is an engaging puzzle game where players swap colored boxes to solve challenging levels. This web version brings the classic gameplay to browsers with smooth animations and responsive design.

## Features

- 🎮 **80 Challenging Levels** - Progressive difficulty with unique puzzle designs
- 🎨 **Modern Web Graphics** - Built with Phaser 3 for smooth performance
- 📱 **Responsive Design** - Works on desktop and mobile devices  
- ⚡ **Fast Loading** - Optimized build with webpack
- 🎯 **Intuitive Controls** - Easy-to-learn gameplay mechanics

## Technology Stack

- **Phaser 3** - Game framework for 2D games
- **Webpack** - Module bundler for optimized builds
- **Modern JavaScript** - ES6+ features for clean code
- **JSON Data** - Level configuration system

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/gcreate-io/tetroswap-web.git
   cd tetroswap-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

### Building for Production

Create an optimized build for deployment:

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment to any web server.

## Game Mechanics

- **Objective**: Swap adjacent colored boxes to match the target pattern
- **Controls**: Click and drag to swap boxes
- **Strategy**: Plan your moves carefully - some levels require specific sequences
- **Progression**: Complete levels to unlock new challenges

## Project Structure

```
src/
├── assets/
│   └── levels/          # JSON level definitions (1-80)
├── game/
│   ├── Box.js          # Box game object
│   ├── GameData.js     # Game state management  
│   ├── Grid.js         # Grid system
│   └── Level.js        # Level loading logic
├── scenes/
│   ├── GameScene.js    # Main gameplay scene
│   └── MenuScene.js    # Menu and UI scene
└── main.js             # Application entry point
```

## Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Create production build
- `npm run dev` - Start dev server with auto-open

### Level Format

Levels are defined in JSON files with the following structure:
```json
{
  "grid": [
    [1, 2, 3],
    [2, 1, 3], 
    [3, 3, 1]
  ],
  "target": [
    [1, 1, 1],
    [2, 2, 2],
    [3, 3, 3]
  ]
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original Tetroswap concept and design
- Phaser 3 community for excellent documentation
- Contributors who help improve the game

## Live Demo

🎮 **[Play Tetroswap Web](https://gcreate-io.github.io/tetroswap-web/)** 

---

Built with ❤️ using Phaser 3 and modern web technologies
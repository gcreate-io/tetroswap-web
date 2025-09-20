import Phaser from 'phaser';
import Level from '../game/Level.js';
import Grid from '../game/Grid.js';
import GameData from '../game/GameData.js';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.currentLevelNumber = null;
        this.level = null;
        this.grid = null;
        this.ui = {};
        this.isLevelCompleted = false;
    }

    init(data) {
        this.currentLevelNumber = data.levelNumber || 1;
        this.isLevelCompleted = false;
    }

    async create() {
        // Set background
        this.cameras.main.setBackgroundColor('#667eea');
        
        try {
            // Create and load the level
            this.level = new Level(this.currentLevelNumber);
            await this.level.loadLevel();
            
            // Create the visual grid
            this.grid = new Grid(this, this.level);
            this.grid.render();
            
            // Create UI elements
            this.createUI();
            
            // Setup input handling
            this.setupInputHandling();
            
            console.log(`Game scene created for level ${this.currentLevelNumber}`);
            
        } catch (error) {
            console.error('Error loading level:', error);
            this.showError('Failed to load level');
        }
    }

    createUI() {
        // Level title
        this.ui.levelTitle = this.add.text(512, 50, `Level ${this.currentLevelNumber}`, {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Moves counter
        const gameState = this.level.getGameState();
        this.ui.movesText = this.add.text(512, 90, `Moves: ${gameState.moves}/${gameState.targetMoves}`, {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Undo button
        this.ui.undoButton = this.add.rectangle(100, 100, 120, 40, 0x4a90e2);
        this.ui.undoButton.setInteractive();
        
        this.ui.undoText = this.add.text(100, 100, 'Undo', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.ui.undoButton.on('pointerdown', () => this.handleUndo());
        this.ui.undoButton.on('pointerover', () => {
            this.ui.undoButton.setFillStyle(0x357abd);
        });
        this.ui.undoButton.on('pointerout', () => {
            this.ui.undoButton.setFillStyle(0x4a90e2);
        });

        // Back to menu button
        this.ui.backButton = this.add.rectangle(924, 100, 120, 40, 0xff6b6b);
        this.ui.backButton.setInteractive();
        
        this.ui.backText = this.add.text(924, 100, 'Back to Menu', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.ui.backButton.on('pointerdown', () => this.returnToMenu());
        this.ui.backButton.on('pointerover', () => {
            this.ui.backButton.setFillStyle(0xff5252);
        });
        this.ui.backButton.on('pointerout', () => {
            this.ui.backButton.setFillStyle(0xff6b6b);
        });

        this.updateUI();
    }

    setupInputHandling() {
        // Keyboard shortcuts
        this.input.keyboard.on('keydown-U', () => this.handleUndo());
        this.input.keyboard.on('keydown-ESC', () => this.returnToMenu());
        this.input.keyboard.on('keydown-SPACE', () => this.grid.clearSelection());
    }

    // Handle undo button click
    handleUndo() {
        if (this.grid) {
            this.grid.undo();
            this.updateUI();
        }
    }

    // Update UI elements based on game state
    updateUI() {
        if (!this.level) return;
        
        const gameState = this.level.getGameState();
        
        // Update moves counter
        if (this.ui.movesText) {
            this.ui.movesText.setText(`Moves: ${gameState.moves}/${gameState.targetMoves}`);
            
            // Color based on performance
            if (gameState.moves <= gameState.targetMoves) {
                this.ui.movesText.setColor('#50c878'); // Green for good
            } else {
                this.ui.movesText.setColor('#e74c3c'); // Red for over target
            }
        }
        
        // Update undo button state
        if (this.ui.undoButton) {
            if (gameState.canUndo) {
                this.ui.undoButton.setAlpha(1);
                this.ui.undoText.setAlpha(1);
            } else {
                this.ui.undoButton.setAlpha(0.5);
                this.ui.undoText.setAlpha(0.5);
            }
        }
    }

    // Called by Grid when game state changes
    onGameStateChanged(gameState) {
        this.updateUI();
    }

    // Called by Grid when level is completed
    onLevelCompleted(gameState) {
        if (this.isLevelCompleted) return; // Prevent multiple calls
        
        this.isLevelCompleted = true;
        
        // Mark level as completed in GameData
        GameData.markLevelComplete(
            this.currentLevelNumber, 
            gameState.moves, 
            gameState.isPerfect
        );
        
        // Show completion message
        this.showLevelCompleteMessage(gameState);
        
        console.log(`Level ${this.currentLevelNumber} completed in ${gameState.moves} moves!`);
    }

    showLevelCompleteMessage(gameState) {
        // Create HTML completion popup that appears above everything
        this.createHTMLCompletionPopup(gameState);
    }
    
    createHTMLCompletionPopup(gameState) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
        `;
        
        // Create completion box with immediate positioning
        const completionBox = document.createElement('div');
        
        // Calculate position immediately
        const canvas = document.querySelector('canvas');
        let transformX = '50vw';
        let transformY = '50vh';
        
        if (canvas) {
            const canvasRect = canvas.getBoundingClientRect();
            if (canvasRect.width > 0 && canvasRect.height > 0) {
                const phaserX = 512; // Center of 1024px width
                const phaserY = 384; // Center of 768px height
                const domX = canvasRect.left + (phaserX / 1024) * canvasRect.width;
                const domY = canvasRect.top + (phaserY / 768) * canvasRect.height;
                transformX = domX + 'px';
                transformY = domY + 'px';
                console.log(`Initial popup position: (${domX}, ${domY})`);
            }
        }
        
        completionBox.style.cssText = `
            position: fixed;
            left: 0;
            top: 0;
            background: rgba(255, 255, 255, 0.92);
            border: 4px solid #50c878;
            border-radius: 16px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3);
            min-width: 300px;
            transform: translate(calc(${transformX} - 50%), calc(${transformY} - 50%));
            opacity: 0;
            will-change: opacity;
            transition: none;
        `;
        
        // Title
        const title = document.createElement('h2');
        title.textContent = 'Level Complete!';
        title.style.cssText = `
            margin: 0 0 20px 0;
            font-size: 32px;
            color: #333333;
            font-family: Arial, sans-serif;
            font-weight: bold;
        `;
        
        // Moves info
        const movesText = gameState.isPerfect 
            ? `Perfect! ${gameState.moves}/${gameState.targetMoves} moves`
            : `Completed in ${gameState.moves} moves`;
            
        const movesInfo = document.createElement('p');
        movesInfo.textContent = movesText;
        movesInfo.style.cssText = `
            margin: 0 0 30px 0;
            font-size: 18px;
            color: ${gameState.isPerfect ? '#50c878' : '#666666'};
            font-family: Arial, sans-serif;
        `;
        
        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: center;
        `;
        
        // Next level button (if not last level)
        if (this.currentLevelNumber < 80) {
            const nextButton = document.createElement('button');
            nextButton.textContent = 'Next Level';
            nextButton.style.cssText = `
                background: #4a90e2;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 16px;
                font-family: Arial, sans-serif;
                cursor: pointer;
                transition: all 0.2s ease;
            `;
            
            nextButton.addEventListener('mouseenter', () => {
                nextButton.style.background = '#357abd';
                nextButton.style.transform = 'translateY(-2px)';
            });
            
            nextButton.addEventListener('mouseleave', () => {
                nextButton.style.background = '#4a90e2';
                nextButton.style.transform = 'translateY(0)';
            });
            
            nextButton.addEventListener('click', () => {
                // Clean up resize handler
                if (overlay.resizeHandler) {
                    window.removeEventListener('resize', overlay.resizeHandler);
                }
                document.body.removeChild(overlay);
                // Clean up current grid before transitioning
                if (this.grid) {
                    this.grid.destroy();
                    this.grid = null;
                }
                this.scene.start('GameScene', { levelNumber: this.currentLevelNumber + 1 });
            });
            
            buttonContainer.appendChild(nextButton);
        }
        
        // Menu button
        const menuButton = document.createElement('button');
        menuButton.textContent = 'Menu';
        menuButton.style.cssText = `
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-family: Arial, sans-serif;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        
        menuButton.addEventListener('mouseenter', () => {
            menuButton.style.background = '#ff5252';
            menuButton.style.transform = 'translateY(-2px)';
        });
        
        menuButton.addEventListener('mouseleave', () => {
            menuButton.style.background = '#ff6b6b';
            menuButton.style.transform = 'translateY(0)';
        });
        
        menuButton.addEventListener('click', () => {
            // Clean up resize handler
            if (overlay.resizeHandler) {
                window.removeEventListener('resize', overlay.resizeHandler);
            }
            document.body.removeChild(overlay);
            this.returnToMenu();
        });
        
        buttonContainer.appendChild(menuButton);
        
        // Assemble the popup
        completionBox.appendChild(title);
        completionBox.appendChild(movesInfo);
        completionBox.appendChild(buttonContainer);
        overlay.appendChild(completionBox);
        
        // Add to page
        document.body.appendChild(overlay);
        
        // Show popup with simple fade - no transform animation to avoid conflicts
        setTimeout(() => {
            completionBox.style.opacity = '1';
            completionBox.style.transition = 'opacity 0.3s ease-out';
        }, 10);
        
        // Add resize handler to keep popup centered
        const resizeHandler = () => {
            const canvas = document.querySelector('canvas');
            if (canvas) {
                const canvasRect = canvas.getBoundingClientRect();
                if (canvasRect.width > 0 && canvasRect.height > 0) {
                    const phaserX = 512;
                    const phaserY = 384;
                    const domX = canvasRect.left + (phaserX / 1024) * canvasRect.width;
                    const domY = canvasRect.top + (phaserY / 768) * canvasRect.height;
                    completionBox.style.transform = `translate(calc(${domX}px - 50%), calc(${domY}px - 50%))`;
                }
            }
        };
        window.addEventListener('resize', resizeHandler);
        
        // Store resize handler on overlay for cleanup
        overlay.resizeHandler = resizeHandler;
        
        // Add CSS animations
        if (!document.querySelector('#completion-popup-styles')) {
            const style = document.createElement('style');
            style.id = 'completion-popup-styles';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from { 
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Center completion popup using the same positioning logic as the grid
    centerCompletionPopup(completionBox) {
        // Find the Phaser canvas element
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            console.warn('Canvas not found, using viewport center as fallback');
            // Fallback to viewport center
            completionBox.style.left = '50vw';
            completionBox.style.top = '50vh';
            return;
        }
        
        // Get canvas position and dimensions
        const canvasRect = canvas.getBoundingClientRect();
        
        // Ensure canvas has valid dimensions
        if (canvasRect.width === 0 || canvasRect.height === 0) {
            console.warn('Canvas dimensions not ready, using viewport center as fallback');
            completionBox.style.left = '50vw';
            completionBox.style.top = '50vh';
            return;
        }
        
        // Use center coordinates (512, 384) - same as error messages and center of canvas
        const phaserX = 512; // Center of 1024px width
        const phaserY = 384; // Center of 768px height
        
        // Convert Phaser coordinates to DOM coordinates
        const domX = canvasRect.left + (phaserX / 1024) * canvasRect.width;
        const domY = canvasRect.top + (phaserY / 768) * canvasRect.height;
        
        // Position the completion box
        completionBox.style.left = domX + 'px';
        completionBox.style.top = domY + 'px';
        
        console.log(`Positioned popup at DOM coords: (${domX}, ${domY}) from canvas rect:`, canvasRect);
    }

    showError(message) {
        this.add.text(512, 384, message, {
            fontSize: '24px',
            color: '#ff0000',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Add return to menu button
        const backButton = this.add.rectangle(512, 450, 200, 60, 0xff6b6b);
        backButton.setInteractive();
        
        this.add.text(512, 450, 'Return to Menu', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        backButton.on('pointerdown', () => this.returnToMenu());
    }

    returnToMenu() {
        // Clean up
        if (this.grid) {
            this.grid.destroy();
        }
        
        // Return to menu scene
        this.scene.start('MenuScene');
    }

    // Clean up when scene is destroyed
    destroy() {
        if (this.grid) {
            this.grid.destroy();
        }
        super.destroy();
    }
}

export default GameScene;
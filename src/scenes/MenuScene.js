import Phaser from 'phaser';
import GameData from '../game/GameData.js';

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        
        this.currentPage = 0;
        this.levelsPerPage = 20;
        this.totalPages = 4; // 80 levels / 20 per page
        this.levelButtons = [];
        this.gridContainer = null;
        this.prevButton = null;
        this.nextButton = null;
        this.pageIndicator = null;
        this.loadingText = null;
    }

    async create() {
        // Background
        this.cameras.main.setBackgroundColor('#667eea');
        
        // Show loading text
        this.loadingText = this.add.text(512, 384, 'Loading levels...', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Load levels data
        await GameData.loadAllLevels();
        
        // Remove loading text
        this.loadingText.destroy();
        
        // Create UI
        this.createTitle();
        this.createLevelGrid();
        this.createNavigationButtons();
        this.createPageIndicator();
        
        // Load saved page
        this.currentPage = GameData.getCurrentPage();
        this.updateLevelGrid();
    }

    createTitle() {
        this.add.text(512, 80, 'TETROSWAP', {
            fontSize: '60px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(512, 130, 'Brainswapping puzzle game | gcreate.io', {
            fontSize: '24px',
            color: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    createLevelGrid() {
        this.gridContainer = this.add.container(512, 400);
        
        // Create 4x5 grid of level buttons
        const cols = 5;
        const rows = 4;
        const buttonWidth = 80;
        const buttonHeight = 60;
        const spacingX = 100;
        const spacingY = 80;
        
        const startX = -(cols - 1) * spacingX / 2;
        const startY = -(rows - 1) * spacingY / 2;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * spacingX;
                const y = startY + row * spacingY;
                const index = row * cols + col;
                
                // Create button background
                const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0x4a90e2);
                button.setInteractive();
                
                // Create button text
                const text = this.add.text(x, y, '1', {
                    fontSize: '20px',
                    color: '#ffffff',
                    fontFamily: 'Arial',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
                
                // Store references
                this.levelButtons[index] = {
                    button: button,
                    text: text,
                    levelNumber: 1,
                    isLocked: false
                };
                
                // Add to container
                this.gridContainer.add([button, text]);
                
                // Add click handler
                button.on('pointerdown', () => this.onLevelClick(index));
                button.on('pointerover', () => this.onLevelHover(index, true));
                button.on('pointerout', () => this.onLevelHover(index, false));
            }
        }
    }

    createNavigationButtons() {
        // Previous button
        this.prevButton = this.add.circle(200, 400, 30, 0xff6b6b);
        this.prevButton.setInteractive();
        
        const prevText = this.add.text(200, 400, '◀', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.prevButton.on('pointerdown', () => this.onPrevPage());
        this.prevButton.on('pointerover', () => {
            if (!this.prevButton.disabled) {
                this.prevButton.setFillStyle(0xff5252);
            }
        });
        this.prevButton.on('pointerout', () => {
            if (!this.prevButton.disabled) {
                this.prevButton.setFillStyle(0xff6b6b);
            }
        });
        
        // Next button
        this.nextButton = this.add.circle(824, 400, 30, 0xff6b6b);
        this.nextButton.setInteractive();
        
        const nextText = this.add.text(824, 400, '▶', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.nextButton.on('pointerdown', () => this.onNextPage());
        this.nextButton.on('pointerover', () => {
            if (!this.nextButton.disabled) {
                this.nextButton.setFillStyle(0xff5252);
            }
        });
        this.nextButton.on('pointerout', () => {
            if (!this.nextButton.disabled) {
                this.nextButton.setFillStyle(0xff6b6b);
            }
        });
    }

    createPageIndicator() {
        this.pageIndicator = this.add.text(512, 600, '', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    updateLevelGrid() {
        const startLevel = this.currentPage * this.levelsPerPage + 1;
        
        for (let i = 0; i < this.levelButtons.length; i++) {
            const levelNumber = startLevel + i;
            const buttonData = this.levelButtons[i];
            
            if (levelNumber <= 80) {
                buttonData.levelNumber = levelNumber;
                buttonData.text.setText(levelNumber.toString());
                
                // Determine button state
                const isCompleted = GameData.isLevelCompleted(levelNumber);
                const isUnlocked = GameData.isLevelUnlocked(levelNumber);
                
                buttonData.isLocked = !isUnlocked;
                
                // Update button appearance
                if (isCompleted) {
                    buttonData.button.setFillStyle(0x50c878); // Green for completed
                    buttonData.button.setAlpha(1);
                } else if (isUnlocked) {
                    buttonData.button.setFillStyle(0x4a90e2); // Blue for available
                    buttonData.button.setAlpha(1);
                } else {
                    buttonData.button.setFillStyle(0x888888); // Gray for locked
                    buttonData.button.setAlpha(0.6);
                }
                
                // Show/hide button
                buttonData.button.setVisible(true);
                buttonData.text.setVisible(true);
            } else {
                // Hide buttons for non-existent levels
                buttonData.button.setVisible(false);
                buttonData.text.setVisible(false);
            }
        }
        
        this.updateNavigationButtons();
        this.updatePageIndicator();
    }

    updateNavigationButtons() {
        // Update previous button
        this.prevButton.disabled = (this.currentPage === 0);
        this.prevButton.setFillStyle(this.prevButton.disabled ? 0xcccccc : 0xff6b6b);
        this.prevButton.setAlpha(this.prevButton.disabled ? 0.5 : 1);
        
        // Update next button  
        this.nextButton.disabled = (this.currentPage >= this.totalPages - 1);
        this.nextButton.setFillStyle(this.nextButton.disabled ? 0xcccccc : 0xff6b6b);
        this.nextButton.setAlpha(this.nextButton.disabled ? 0.5 : 1);
    }

    updatePageIndicator() {
        const startLevel = this.currentPage * this.levelsPerPage + 1;
        const endLevel = Math.min(startLevel + this.levelsPerPage - 1, 80);
        const completedCount = GameData.getCompletedLevelsCount();
        
        this.pageIndicator.setText(
            `Levels ${startLevel}-${endLevel} | Completed: ${completedCount}/80`
        );
    }

    onLevelClick(index) {
        const buttonData = this.levelButtons[index];
        
        if (buttonData.isLocked) {
            console.log(`Level ${buttonData.levelNumber} is locked`);
            return;
        }
        
        console.log(`Starting level ${buttonData.levelNumber}`);
        
        // Start the game scene with the selected level
        this.scene.start('GameScene', { levelNumber: buttonData.levelNumber });
    }

    onLevelHover(index, isHovering) {
        const buttonData = this.levelButtons[index];
        
        if (buttonData.isLocked) return;
        
        if (isHovering) {
            const isCompleted = GameData.isLevelCompleted(buttonData.levelNumber);
            const currentColor = isCompleted ? 0x50c878 : 0x4a90e2;
            const hoverColor = isCompleted ? 0x45b56b : 0x357abd;
            
            buttonData.button.setFillStyle(hoverColor);
        } else {
            // Restore original color
            const isCompleted = GameData.isLevelCompleted(buttonData.levelNumber);
            const originalColor = isCompleted ? 0x50c878 : 0x4a90e2;
            
            buttonData.button.setFillStyle(originalColor);
        }
    }

    onPrevPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            GameData.setCurrentPage(this.currentPage);
            this.updateLevelGrid();
        }
    }

    onNextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            GameData.setCurrentPage(this.currentPage);
            this.updateLevelGrid();
        }
    }
}

export default MenuScene;
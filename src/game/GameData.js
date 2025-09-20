class GameData {
    static levels = [];
    static progress = {};
    static isLoaded = false;

    static async loadAllLevels() {
        if (this.isLoaded) return;

        try {
            // Load all 80 levels using dynamic imports
            for (let i = 1; i <= 80; i++) {
                try {
                    const levelModule = await import(`../assets/levels/${i}.json`);
                    this.levels[i] = {
                        levelNumber: i,
                        ...levelModule.default
                    };
                } catch (error) {
                    console.warn(`Failed to load level ${i}, using fallback:`, error);
                    this.levels[i] = this.createFallbackLevel(i);
                }
            }
            
            this.loadProgress();
            this.isLoaded = true;
            console.log('All levels loaded successfully');
        } catch (error) {
            console.error('Error loading levels:', error);
            this.createFallbackLevels();
        }
    }

    static createFallbackLevel(levelNumber) {
        // Create a simple 2x2 level as fallback
        return {
            levelNumber,
            tiles: [
                ["a", "b"],
                ["b", "a"]
            ],
            rows: 2,
            cols: 2,
            swaps: 1,
            completed: false
        };
    }

    static createFallbackLevels() {
        // Create 80 fallback levels if loading fails
        for (let i = 1; i <= 80; i++) {
            this.levels[i] = this.createFallbackLevel(i);
        }
        this.loadProgress();
        this.isLoaded = true;
        console.log('Created fallback levels');
    }

    static getLevelData(levelNumber) {
        if (!this.isLoaded) {
            console.warn('Levels not loaded yet');
            return null;
        }
        return this.levels[levelNumber] || null;
    }

    static isLevelUnlocked(levelNumber) {
        if (levelNumber === 1) return true; // First level is always unlocked
        
        // Check if previous level is completed
        return this.isLevelCompleted(levelNumber - 1);
    }

    static isLevelCompleted(levelNumber) {
        return this.progress[levelNumber]?.completed || false;
    }

    static markLevelComplete(levelNumber, moves = 0, perfect = false) {
        if (!this.progress[levelNumber]) {
            this.progress[levelNumber] = {};
        }
        
        this.progress[levelNumber].completed = true;
        this.progress[levelNumber].bestMoves = this.progress[levelNumber].bestMoves 
            ? Math.min(this.progress[levelNumber].bestMoves, moves)
            : moves;
        
        if (perfect) {
            this.progress[levelNumber].perfect = true;
        }
        
        this.saveProgress();
        console.log(`Level ${levelNumber} completed!`);
    }

    static saveProgress() {
        try {
            localStorage.setItem('tetroswap_progress', JSON.stringify(this.progress));
        } catch (error) {
            console.warn('Could not save progress:', error);
        }
    }

    static loadProgress() {
        try {
            const saved = localStorage.getItem('tetroswap_progress');
            if (saved) {
                this.progress = JSON.parse(saved);
            } else {
                this.progress = {};
            }
        } catch (error) {
            console.warn('Could not load progress:', error);
            this.progress = {};
        }
    }

    static resetProgress() {
        this.progress = {};
        this.saveProgress();
        console.log('Progress reset');
    }

    static getCompletedLevelsCount() {
        return Object.keys(this.progress).filter(level => this.progress[level].completed).length;
    }

    static getCurrentPage() {
        try {
            return parseInt(localStorage.getItem('tetroswap_current_page') || '0');
        } catch {
            return 0;
        }
    }

    static setCurrentPage(page) {
        try {
            localStorage.setItem('tetroswap_current_page', page.toString());
        } catch (error) {
            console.warn('Could not save current page:', error);
        }
    }
}

export default GameData;
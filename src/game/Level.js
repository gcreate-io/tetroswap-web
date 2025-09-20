import Box, { BoxColor } from './Box.js';
import GameData from './GameData.js';

class Level {
    constructor(levelNumber) {
        this.levelNumber = levelNumber;
        this.levelData = null;
        this.boxes = []; // 2D array of boxes
        this.rows = 0;
        this.cols = 0;
        this.targetMoves = 0;
        this.currentMoves = 0;
        this.undoHistory = []; // Array of previous grid states
        this.maxUndoSteps = 10;
    }

    // Load level data from GameData
    async loadLevel() {
        this.levelData = GameData.getLevelData(this.levelNumber);
        if (!this.levelData) {
            throw new Error(`Level ${this.levelNumber} not found`);
        }

        this.rows = this.levelData.rows;
        this.cols = this.levelData.cols;
        this.targetMoves = this.levelData.swaps;
        this.currentMoves = 0;
        this.undoHistory = [];

        // Initialize empty 2D array
        this.boxes = [];
        for (let row = 0; row < this.rows; row++) {
            this.boxes[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.boxes[row][col] = null;
            }
        }

        // Create boxes from level data
        this.createBoxesFromData();
        
        // Save initial state for undo
        this.saveStateForUndo();

        console.log(`Level ${this.levelNumber} loaded: ${this.cols}x${this.rows}, target: ${this.targetMoves} moves`);
    }

    // Create box objects from the JSON level data
    createBoxesFromData() {
        const tiles = this.levelData.tiles;
        
        // JSON structure: tiles[row][col] maps directly to boxes[row][col]
        // No coordinate flipping needed
        for (let row = 0; row < tiles.length; row++) {
            const rowData = tiles[row];
            
            for (let col = 0; col < rowData.length; col++) {
                const colorCode = rowData[col];
                
                // Create box for any defined tile (including "0" for empty visible tiles)
                // Only skip creation for empty strings ("") which represent invisible tiles
                if (colorCode !== undefined && colorCode !== '') {
                    this.boxes[row][col] = new Box(col, row, colorCode);
                }
                // For invisible tiles (empty string), leave boxes[row][col] as null
            }
        }
    }

    // Get box at specific position
    getBox(col, row) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return null;
        }
        return this.boxes[row][col];
    }

    // Set box at specific position
    setBox(col, row, box) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return false;
        }
        this.boxes[row][col] = box;
        if (box) {
            box.column = col;
            box.row = row;
        }
        return true;
    }

    // Check if a tile position is invisible (should not be rendered)
    isInvisibleTile(col, row) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return true; // Out of bounds is invisible
        }
        
        // Check if this position was defined as empty string in the JSON
        if (this.levelData && this.levelData.tiles[row] && this.levelData.tiles[row][col] === '') {
            return true;
        }
        
        return false;
    }

    // Get all boxes in a row
    getRow(row) {
        if (row < 0 || row >= this.rows) return [];
        return [...this.boxes[row]];
    }

    // Get all boxes in a column
    getColumn(col) {
        if (col < 0 || col >= this.cols) return [];
        const column = [];
        for (let row = 0; row < this.rows; row++) {
            column.push(this.boxes[row][col]);
        }
        return column;
    }

    // Swap two entire rows
    swapRows(rowA, rowB) {
        if (rowA < 0 || rowA >= this.rows || rowB < 0 || rowB >= this.rows) {
            return false;
        }
        if (rowA === rowB) return false;

        // Check if either row contains invisible tiles - prevent swap if so
        for (let col = 0; col < this.cols; col++) {
            if (this.isInvisibleTile(col, rowA) || this.isInvisibleTile(col, rowB)) {
                console.log(`Cannot swap rows ${rowA} and ${rowB}: contains invisible tiles`);
                return false;
            }
        }

        // Save current state for undo
        this.saveStateForUndo();

        // Swap the rows
        const tempRow = [...this.boxes[rowA]];
        this.boxes[rowA] = [...this.boxes[rowB]];
        this.boxes[rowB] = tempRow;

        // Update box positions
        for (let col = 0; col < this.cols; col++) {
            if (this.boxes[rowA][col]) {
                this.boxes[rowA][col].row = rowA;
            }
            if (this.boxes[rowB][col]) {
                this.boxes[rowB][col].row = rowB;
            }
        }

        this.currentMoves++;
        return true;
    }

    // Swap two entire columns
    swapColumns(colA, colB) {
        if (colA < 0 || colA >= this.cols || colB < 0 || colB >= this.cols) {
            return false;
        }
        if (colA === colB) return false;

        // Check if either column contains invisible tiles - prevent swap if so
        for (let row = 0; row < this.rows; row++) {
            if (this.isInvisibleTile(colA, row) || this.isInvisibleTile(colB, row)) {
                console.log(`Cannot swap columns ${colA} and ${colB}: contains invisible tiles`);
                return false;
            }
        }

        // Save current state for undo
        this.saveStateForUndo();

        // Swap the columns
        for (let row = 0; row < this.rows; row++) {
            const temp = this.boxes[row][colA];
            this.boxes[row][colA] = this.boxes[row][colB];
            this.boxes[row][colB] = temp;

            // Update box positions
            if (this.boxes[row][colA]) {
                this.boxes[row][colA].column = colA;
            }
            if (this.boxes[row][colB]) {
                this.boxes[row][colB].column = colB;
            }
        }

        this.currentMoves++;
        return true;
    }

    // Save current state for undo functionality
    saveStateForUndo() {
        const state = {
            boxes: this.boxes.map(row => 
                row.map(box => box ? box.copy() : null)
            ),
            moves: this.currentMoves
        };
        
        this.undoHistory.unshift(state);
        
        // Keep only the last N states
        if (this.undoHistory.length > this.maxUndoSteps) {
            this.undoHistory.pop();
        }
    }

    // Undo last move
    undo() {
        if (this.undoHistory.length === 0) {
            return false;
        }

        const previousState = this.undoHistory.shift();
        this.boxes = previousState.boxes;
        this.currentMoves = previousState.moves;

        // Update box positions
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const box = this.boxes[row][col];
                if (box) {
                    box.row = row;
                    box.column = col;
                }
            }
        }

        return true;
    }

    // Check if the level is completed (win condition)
    isCompleted() {
        // Check each non-empty box to see if it's part of a group of 4+ connected boxes
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const box = this.boxes[row][col];
                if (box && !box.isEmpty()) {
                    const groupSize = this.getConnectedGroupSize(col, row, new Set());
                    if (groupSize < 4) {
                        return false; // Found a box that's not in a group of 4+
                    }
                }
            }
        }
        return true; // All boxes are in valid groups
    }

    // Get the size of the connected group starting from a specific box
    getConnectedGroupSize(col, row, visited) {
        const key = `${col},${row}`;
        if (visited.has(key)) return 0;

        const box = this.getBox(col, row);
        if (!box || box.isEmpty()) return 0;

        visited.add(key);
        let groupSize = 1;

        // Check all 4 adjacent directions
        const directions = [
            { col: 0, row: 1 },  // Up
            { col: 1, row: 0 },  // Right
            { col: 0, row: -1 }, // Down
            { col: -1, row: 0 }  // Left
        ];

        for (const dir of directions) {
            const newCol = col + dir.col;
            const newRow = row + dir.row;
            const adjacentBox = this.getBox(newCol, newRow);

            if (adjacentBox && 
                !adjacentBox.isEmpty() && 
                adjacentBox.color === box.color &&
                !visited.has(`${newCol},${newRow}`)) {
                
                groupSize += this.getConnectedGroupSize(newCol, newRow, visited);
            }
        }

        return groupSize;
    }

    // Get current game state info
    getGameState() {
        return {
            level: this.levelNumber,
            moves: this.currentMoves,
            targetMoves: this.targetMoves,
            canUndo: this.undoHistory.length > 0,
            isCompleted: this.isCompleted(),
            isPerfect: this.currentMoves <= this.targetMoves
        };
    }

    // Get level dimensions
    getDimensions() {
        return {
            rows: this.rows,
            cols: this.cols
        };
    }

    // Debug: Print the current grid to console
    printGrid() {
        console.log(`Level ${this.levelNumber} Grid (${this.cols}x${this.rows}):`);
        for (let row = this.rows - 1; row >= 0; row--) {
            const rowStr = this.boxes[row]
                .map(box => box ? box.color : '.')
                .join(' ');
            console.log(`Row ${row}: ${rowStr}`);
        }
        console.log(`Moves: ${this.currentMoves}/${this.targetMoves}`);
    }
}

export default Level;
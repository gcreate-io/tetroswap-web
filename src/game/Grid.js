class Grid {
    constructor(scene, level) {
        this.scene = scene;
        this.level = level;
        this.container = null;
        this.boxElements = []; // 2D array of DOM elements
        
        // Drag state
        this.isDragging = false;
        this.dragStartPos = { x: 0, y: 0 };
        this.dragCurrentPos = { x: 0, y: 0 };
        this.dragStartBox = { col: -1, row: -1 };
        this.dragThreshold = 10; // Minimum pixels to start drag
        this.swapType = null; // 'row' or 'column'
        this.swapIndices = { from: -1, to: -1 };
        
        // Visual settings
        this.boxSize = 60;
        this.spacing = 4;
        this.borderRadius = 8;
        
        this.setupContainer();
        this.setupDragHandlers();
        this.setupResizeHandler();
    }

    // Create the main container for the grid
    setupContainer() {
        // Remove existing container if it exists
        if (this.container) {
            this.container.remove();
        }

        // Create main grid container
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: absolute;
            display: grid;
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            z-index: 10;
            pointer-events: auto;
        `;

        // Add to game container and center relative to Phaser canvas
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(this.container);
            this.centerGridInCanvas();
        }
    }

    // Center grid using the same positioning logic as MenuScene
    centerGridInCanvas() {
        // Find the Phaser canvas element
        const canvas = document.querySelector('canvas');
        if (!canvas) return;
        
        // Get canvas position and dimensions
        const canvasRect = canvas.getBoundingClientRect();
        
        // Use the same coordinates as MenuScene (512, 400) but converted to DOM coordinates
        // Phaser canvas is 1024x768, so (512, 400) is center horizontally, slightly below center vertically
        const phaserX = 512; // Center of 1024px width
        const phaserY = 400; // Slightly below center of 768px height
        
        // Convert Phaser coordinates to DOM coordinates
        const domX = canvasRect.left + (phaserX / 1024) * canvasRect.width;
        const domY = canvasRect.top + (phaserY / 768) * canvasRect.height;
        
        // Position the container
        this.container.style.left = domX + 'px';
        this.container.style.top = domY + 'px';
        this.container.style.transform = 'translate(-50%, -50%)';
    }

    // Render the grid based on current level state
    render() {
        if (!this.level) return;

        const { rows, cols } = this.level.getDimensions();
        
        // Set grid template (CSS Grid)
        this.container.style.gridTemplateColumns = `repeat(${cols}, ${this.boxSize}px)`;
        this.container.style.gridTemplateRows = `repeat(${rows}, ${this.boxSize}px)`;
        this.container.style.display = 'grid';
        this.container.style.gap = `${this.spacing}px`;

        // Clear existing elements
        this.container.innerHTML = '';
        this.boxElements = [];

        // Initialize 2D array for elements
        for (let row = 0; row < rows; row++) {
            this.boxElements[row] = [];
        }

        // Create box elements (render directly without coordinate flipping)
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let element;
                
                if (this.level.isInvisibleTile(col, row)) {
                    // Create invisible placeholder div to maintain grid layout
                    element = this.createInvisibleElement(col, row);
                    this.boxElements[row][col] = null; // Mark as invisible for interaction
                } else {
                    // Create normal box element
                    const box = this.level.getBox(col, row);
                    element = this.createBoxElement(box, col, row);
                    this.boxElements[row][col] = element; // Store for interaction
                }
                
                // Add to container (both visible and invisible placeholders)
                this.container.appendChild(element);
            }
        }

        console.log(`Grid rendered: ${cols}x${rows}`);
        
        // Recenter the grid after rendering
        this.centerGridInCanvas();
    }

    // Create a single box element
    createBoxElement(box, col, row) {
        const element = document.createElement('div');
        
        // Basic box styling with smooth transitions (CSS Grid positioning)
        element.style.cssText = `
            width: ${this.boxSize}px;
            height: ${this.boxSize}px;
            border-radius: ${this.borderRadius}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 16px;
            cursor: grab;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        `;

        // Set box content and colors
        if (box && !box.isEmpty()) {
            const styles = box.getStyles();
            element.style.backgroundColor = styles.backgroundColor;
            element.style.color = styles.color;
            // No text content - just solid colors
            element.textContent = '';
            
            // Store box reference
            element.boxData = box;
        } else {
            // Empty box
            element.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            element.style.border = '2px dashed rgba(255, 255, 255, 0.3)';
            element.textContent = '';
            element.boxData = null;
        }

        // Add drag event handlers
        element.addEventListener('mousedown', (e) => this.handleDragStart(e, col, row));
        element.addEventListener('touchstart', (e) => this.handleDragStart(e, col, row), { passive: false });

        return element;
    }

    // Create an invisible placeholder element to maintain grid layout
    createInvisibleElement(col, row) {
        const element = document.createElement('div');
        
        // Invisible styling - takes up space but not visible or interactive
        element.style.cssText = `
            width: ${this.boxSize}px;
            height: ${this.boxSize}px;
            visibility: hidden;
            pointer-events: none;
        `;
        
        return element;
    }

    // Setup resize handler to keep grid centered
    setupResizeHandler() {
        this.resizeHandler = () => this.centerGridInCanvas();
        window.addEventListener('resize', this.resizeHandler);
    }

    // Setup global event handlers for drag operations
    setupDragHandlers() {
        // Mouse events
        document.addEventListener('mousemove', (e) => this.handleDragMove(e));
        document.addEventListener('mouseup', (e) => this.handleDragEnd(e));
        
        // Touch events
        document.addEventListener('touchmove', (e) => this.handleDragMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleDragEnd(e));
        document.addEventListener('touchcancel', (e) => this.handleDragEnd(e));
    }

    // Handle start of drag operation
    handleDragStart(event, col, row) {
        event.preventDefault();
        
        // Don't allow drag start on invisible tiles
        if (this.level.isInvisibleTile(col, row)) {
            console.log(`Cannot drag from invisible tile at (${col}, ${row})`);
            return;
        }
        
        // Get initial position
        const clientX = event.clientX || (event.touches && event.touches[0].clientX);
        const clientY = event.clientY || (event.touches && event.touches[0].clientY);
        
        this.dragStartPos = { x: clientX, y: clientY };
        this.dragCurrentPos = { x: clientX, y: clientY };
        this.dragStartBox = { col, row };
        this.isDragging = false; // Will become true when threshold is exceeded
        this.swapType = null;
        
        console.log(`Drag start at box (${col}, ${row})`);
    }

    // Handle drag movement
    handleDragMove(event) {
        if (this.dragStartBox.col === -1) return;
        
        event.preventDefault();
        
        // Get current position
        const clientX = event.clientX || (event.touches && event.touches[0].clientX);
        const clientY = event.clientY || (event.touches && event.touches[0].clientY);
        
        this.dragCurrentPos = { x: clientX, y: clientY };
        
        // Calculate drag distance
        const deltaX = clientX - this.dragStartPos.x;
        const deltaY = clientY - this.dragStartPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (!this.isDragging && distance > this.dragThreshold) {
            // Start dragging - determine direction
            this.isDragging = true;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                this.swapType = 'column';
                console.log('Started column drag');
            } else {
                this.swapType = 'row';
                console.log('Started row drag');
            }
            
            this.highlightDragStart();
        }
        
        if (this.isDragging) {
            this.updateDragPreview(deltaX, deltaY);
        }
    }

    // Handle end of drag operation
    handleDragEnd(event) {
        if (this.dragStartBox.col === -1) return;
        
        if (this.isDragging) {
            this.performDragSwap();
        }
        
        // Reset drag state
        this.isDragging = false;
        this.dragStartBox = { col: -1, row: -1 };
        this.swapType = null;
        this.clearAllHighlights();
        
        console.log('Drag ended');
    }

    // Highlight the start of drag operation - only highlight boxes that can actually be swapped
    highlightDragStart() {
        const { col, row } = this.dragStartBox;
        const { rows, cols } = this.level.getDimensions();
        
        // Change cursor and highlight based on drag type
        if (this.swapType === 'row') {
            document.body.style.cursor = 'ns-resize';
            // Only highlight boxes on visible tiles in this row
            for (let c = 0; c < cols; c++) {
                if (!this.level.isInvisibleTile(c, row)) {
                    this.highlightBox(c, row, true);
                }
            }
        } else if (this.swapType === 'column') {
            document.body.style.cursor = 'ew-resize';
            // Only highlight boxes on visible tiles in this column
            for (let r = 0; r < rows; r++) {
                if (!this.level.isInvisibleTile(col, r)) {
                    this.highlightBox(col, r, true);
                }
            }
        }
    }

    // Update drag preview based on current drag position
    updateDragPreview(deltaX, deltaY) {
        const { col, row } = this.dragStartBox;
        const { rows, cols } = this.level.getDimensions();
        
        if (this.swapType === 'row') {
            // Calculate which row we're over
            const rowOffset = Math.round(deltaY / (this.boxSize + this.spacing));
            const targetRow = Math.max(0, Math.min(rows - 1, row + rowOffset));
            
            if (targetRow !== row && targetRow !== this.swapIndices.to) {
                this.swapIndices = { from: row, to: targetRow };
                this.previewRowSwap(row, targetRow);
            }
        } else if (this.swapType === 'column') {
            // Calculate which column we're over
            const colOffset = Math.round(deltaX / (this.boxSize + this.spacing));
            const targetCol = Math.max(0, Math.min(cols - 1, col + colOffset));
            
            if (targetCol !== col && targetCol !== this.swapIndices.to) {
                this.swapIndices = { from: col, to: targetCol };
                this.previewColumnSwap(col, targetCol);
            }
        }
    }

    // Perform the actual swap based on drag result
    performDragSwap() {
        if (this.swapIndices.from !== this.swapIndices.to && this.swapIndices.to !== -1) {
            if (this.swapType === 'row') {
                this.performRowSwap(this.swapIndices.from, this.swapIndices.to);
            } else if (this.swapType === 'column') {
                this.performColumnSwap(this.swapIndices.from, this.swapIndices.to);
            }
        }
        
        // Reset swap indices
        this.swapIndices = { from: -1, to: -1 };
    }

    // Perform row swap
    performRowSwap(rowA, rowB) {
        console.log(`Swapping rows ${rowA} and ${rowB}`);
        
        if (this.level.swapRows(rowA, rowB)) {
            this.animateRowSwap(rowA, rowB, () => {
                this.render(); // Re-render after swap
                this.checkWinCondition();
            });
        }
    }

    // Perform column swap
    performColumnSwap(colA, colB) {
        console.log(`Swapping columns ${colA} and ${colB}`);
        
        if (this.level.swapColumns(colA, colB)) {
            this.animateColumnSwap(colA, colB, () => {
                this.render(); // Re-render after swap
                this.checkWinCondition();
            });
        }
    }

    // Simple swap animation (can be enhanced later)
    animateRowSwap(rowA, rowB, callback) {
        // For now, just call callback immediately
        // Later we can add CSS transitions or other animations
        setTimeout(callback, 100);
    }

    animateColumnSwap(colA, colB, callback) {
        // For now, just call callback immediately  
        // Later we can add CSS transitions or other animations
        setTimeout(callback, 100);
    }

    // Highlight a specific box with different styles
    highlightBox(col, row, highlight, style = 'primary') {
        // Skip highlighting invisible tiles
        if (this.level.isInvisibleTile(col, row)) {
            return;
        }
        
        const element = this.boxElements[row]?.[col];
        if (element) {
            if (highlight) {
                if (style === 'primary') {
                    // Primary highlight (original selection)
                    element.style.border = '3px solid #ffffff';
                    element.style.transform = 'scale(1.05)';
                    element.style.boxShadow = '0 4px 16px rgba(255, 255, 255, 0.5)';
                } else if (style === 'secondary') {
                    // Secondary highlight (target for swap)
                    element.style.border = '3px solid #ffeb3b';
                    element.style.transform = 'scale(1.03)';
                    element.style.boxShadow = '0 4px 16px rgba(255, 235, 59, 0.4)';
                }
            } else {
                // Remove highlight
                element.style.border = '2px solid rgba(255, 255, 255, 0.2)';
                element.style.transform = 'scale(1)';
                element.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }
        }
    }

    // Preview row swap with enhanced highlighting - only highlight boxes that will actually swap
    previewRowSwap(rowA, rowB) {
        this.clearAllHighlights();
        
        // Only highlight positions where both tiles are visible (actual swap will occur)
        const { cols } = this.level.getDimensions();
        for (let col = 0; col < cols; col++) {
            if (!this.level.isInvisibleTile(col, rowA) && !this.level.isInvisibleTile(col, rowB)) {
                // Both positions visible - these boxes will swap
                this.highlightBox(col, rowA, true, 'primary'); // Original row
                this.highlightBox(col, rowB, true, 'secondary'); // Target row
            }
        }
    }

    // Preview column swap with enhanced highlighting - only highlight boxes that will actually swap
    previewColumnSwap(colA, colB) {
        this.clearAllHighlights();
        
        // Only highlight positions where both tiles are visible (actual swap will occur)
        const { rows } = this.level.getDimensions();
        for (let row = 0; row < rows; row++) {
            if (!this.level.isInvisibleTile(colA, row) && !this.level.isInvisibleTile(colB, row)) {
                // Both positions visible - these boxes will swap
                this.highlightBox(colA, row, true, 'primary'); // Original column
                this.highlightBox(colB, row, true, 'secondary'); // Target column
            }
        }
    }

    // Clear all highlights and reset cursor
    clearAllHighlights() {
        if (!this.boxElements) return;
        
        // Reset cursor
        document.body.style.cursor = 'default';
        
        const { rows, cols } = this.level.getDimensions();
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.highlightBox(col, row, false);
            }
        }
    }

    // Disable/enable grid interactions
    setInteractionEnabled(enabled) {
        if (this.container) {
            this.container.style.pointerEvents = enabled ? 'auto' : 'none';
        }
    }

    // Check win condition and notify scene
    checkWinCondition() {
        const gameState = this.level.getGameState();
        
        if (gameState.isCompleted) {
            console.log('Level completed!');
            // Disable interactions when level is complete
            this.setInteractionEnabled(false);
            
            // Notify the scene about completion
            if (this.scene.onLevelCompleted) {
                this.scene.onLevelCompleted(gameState);
            }
        }
        
        // Notify scene about state change
        if (this.scene.onGameStateChanged) {
            this.scene.onGameStateChanged(gameState);
        }
    }

    // Update display (called when game state changes)
    updateDisplay() {
        // This could update UI elements like move counter, undo button, etc.
        const gameState = this.level.getGameState();
        console.log(`Game state: ${gameState.moves}/${gameState.targetMoves} moves`);
    }

    // Perform undo
    undo() {
        if (this.level.undo()) {
            this.render();
            this.updateDisplay();
            console.log('Undo performed');
            return true;
        }
        return false;
    }

    // Cleanup
    destroy() {
        // Remove global event listeners
        document.removeEventListener('mousemove', this.handleDragMove);
        document.removeEventListener('mouseup', this.handleDragEnd);
        document.removeEventListener('touchmove', this.handleDragMove);
        document.removeEventListener('touchend', this.handleDragEnd);
        document.removeEventListener('touchcancel', this.handleDragEnd);
        
        // Remove resize handler
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        
        // Reset cursor
        document.body.style.cursor = 'default';
        
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.boxElements = [];
    }
}

export default Grid;
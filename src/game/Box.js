// BoxColor enum - maps to the color letters used in JSON level files
const BoxColor = {
    EMPTY: '0',
    BLUE: 'a',
    GREEN: 'b', 
    RED: 'c',
    YELLOW: 'd',
    ORANGE: 'e',
    PINK: 'f',
    LAVENDER: 'g',
    MAGENTA: 'h',
    PURPLE: 'i',
    TEAL: 'j',
    BROWN: 'k',
    MAROON: 'l',
    NAVY: 'm',
    CORAL: 'n',
    BEIGE: 'o',
    CYAN: 'p'
};

// Color mapping for CSS colors
const BoxColorStyles = {
    '0': { backgroundColor: 'transparent', color: 'transparent' }, // Empty
    'a': { backgroundColor: '#4a90e2', color: '#ffffff' }, // Blue
    'b': { backgroundColor: '#50c878', color: '#ffffff' }, // Green
    'c': { backgroundColor: '#e74c3c', color: '#ffffff' }, // Red
    'd': { backgroundColor: '#f1c40f', color: '#333333' }, // Yellow
    'e': { backgroundColor: '#e67e22', color: '#ffffff' }, // Orange
    'f': { backgroundColor: '#ff69b4', color: '#ffffff' }, // Pink
    'g': { backgroundColor: '#dda0dd', color: '#333333' }, // Lavender
    'h': { backgroundColor: '#ff00ff', color: '#ffffff' }, // Magenta
    'i': { backgroundColor: '#9b59b6', color: '#ffffff' }, // Purple
    'j': { backgroundColor: '#1abc9c', color: '#ffffff' }, // Teal
    'k': { backgroundColor: '#8b4513', color: '#ffffff' }, // Brown
    'l': { backgroundColor: '#800000', color: '#ffffff' }, // Maroon
    'm': { backgroundColor: '#000080', color: '#ffffff' }, // Navy
    'n': { backgroundColor: '#ff7f50', color: '#ffffff' }, // Coral
    'o': { backgroundColor: '#f5f5dc', color: '#333333' }, // Beige
    'p': { backgroundColor: '#00ffff', color: '#333333' }  // Cyan
};

// Get color name for debugging/display
const getColorName = (colorCode) => {
    const names = {
        '0': 'Empty',
        'a': 'Blue', 'b': 'Green', 'c': 'Red', 'd': 'Yellow',
        'e': 'Orange', 'f': 'Pink', 'g': 'Lavender', 'h': 'Magenta',
        'i': 'Purple', 'j': 'Teal', 'k': 'Brown', 'l': 'Maroon',
        'm': 'Navy', 'n': 'Coral', 'o': 'Beige', 'p': 'Cyan'
    };
    return names[colorCode] || 'Unknown';
};

class Box {
    constructor(column, row, color) {
        this.column = column;
        this.row = row;
        this.color = color; // Color code (a, b, c, etc.)
        this.element = null; // Will hold the DOM element when rendered
    }

    // Get CSS styles for this box
    getStyles() {
        return BoxColorStyles[this.color] || BoxColorStyles['0'];
    }

    // Get color name for debugging
    getColorName() {
        return getColorName(this.color);
    }

    // Check if this box is empty (visible empty tile with "0")
    isEmpty() {
        return this.color === BoxColor.EMPTY;
    }

    // Check if this tile should not exist (invisible tile with "")
    isInvisible() {
        return this.color === '' || this.color === null || this.color === undefined;
    }

    // Create a copy of this box
    copy() {
        return new Box(this.column, this.row, this.color);
    }

    // String representation for debugging
    toString() {
        return `Box(${this.column},${this.row}):${this.getColorName()}`;
    }

    // Hash value for use in Sets/Maps
    getHash() {
        return `${this.column},${this.row}`;
    }

    // Equality comparison
    equals(other) {
        return other && 
               this.column === other.column && 
               this.row === other.row && 
               this.color === other.color;
    }
}

export { Box, BoxColor, BoxColorStyles, getColorName };
export default Box;
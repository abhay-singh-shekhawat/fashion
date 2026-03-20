const harmoniousPairs = {
    'red': ['black', 'white', 'gray', 'navy', 'gold'],
    'blue': ['white', 'gray', 'black', 'beige', 'brown', 'red'],
    'black': ['anything'],
    'white': ['anything'],
    'gray': ['black', 'white', 'blue', 'red', 'pink'],
    'navy': ['white', 'gray', 'red', 'pink'],
    'green': ['white', 'beige', 'brown', 'black', 'gray'],
    'pink': ['gray', 'white', 'navy', 'black', 'green'],
    'brown': ['beige', 'white', 'green', 'blue'],
    'beige': ['brown', 'white', 'black', 'navy'],
};

const clashingPairs = [
    ['red', 'pink'],
    ['green', 'red'],
    ['orange', 'pink'],

];

export const getColorCompatibility = (color1, color2) => {
    if (!color1 || !color2) return { score: 50, message: 'Unknown colors' };

    color1 = color1.toLowerCase().trim();
    color2 = color2.toLowerCase().trim();

    if (color1 === color2) {
        return { score: 85, message: 'Monochrome / same color — safe and elegant' };
    }

    if (harmoniousPairs[color1]?.includes(color2) || 
        harmoniousPairs[color2]?.includes(color1) ||
        harmoniousPairs[color1] === 'anything' ||
        harmoniousPairs[color2] === 'anything') {
        return { score: 80, message: 'Good match — harmonious' };
    }

    // Check for known clashes
    const pair = [color1, color2].sort().join('-');
    const clashPair = [color2, color1].sort().join('-');
    if (clashingPairs.some(p => p.join('-') === pair || p.join('-') === clashPair)) {
        return { score: 30, message: 'Potential clash — consider alternatives' };
    }

    // Default neutral
    return { score: 60, message: 'Neutral combination — can work depending on shades' };
};
class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

// changing y is not allowed as the position object is frozen.
const position = new Position(1, 3);
Object.freeze(position);

// not valid
position.y = 1990;

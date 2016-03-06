// Freezing not yet supported

class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

// changing y is not allowed as the position object is frozen.
const position = new Position(1, 3);
Object.freeze(position);
position.y = 1990;

class ImmutablePosition {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        Object.freeze(this);
    }
}

// assigning x is not valid as the object itself is frozen
const immutablePosition = new ImmutablePosition(10, 120);
immutablePosition.x = 15;


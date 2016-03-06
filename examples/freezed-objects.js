// @flow

class Position {
    x: number;
    y: number;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

// changing y is not allowed as the position object is frozen.
const position = new Position(1, 3);
position.x = 10;
const frozen = Object.freeze(position);
frozen.y = 1990;

// not supported by flow as properties need to be declared before they are assigned.
// so does not work without modifications
// flow does not detect that frozen.y cannot be modified
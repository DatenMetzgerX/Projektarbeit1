function Square(length, width) {
    this.length = length;
    this.width = width;
}

Square.prototype.area = function() {
    return this.width * this.length;
};

const square = new Square(10, 20);
// valid call
square.area();

const area = square.area;
// non valid call, area is invoked with this = window or undefined, detected by flow
console.log(area());

// valid
console.log(area.call(square));
console.log(area.apply(square, []));

// invalid
console.log(area.call()); // detected by flow
console.log(area.call({ length: 10 })); // detected by flow

const boundedArea = square.area.bind(square);
// valid call, this is bound to square
console.log(boundedArea());
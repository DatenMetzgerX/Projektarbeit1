var defaults = { x: 10, y: 15 };
var options = { x: 13 };

var expanted = _.defaults(options, defaults);
// valid property access, y has been assigned by defaults
console.log(expanted.y);

// neither require nor import works...
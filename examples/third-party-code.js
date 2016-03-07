import * as _ from "lodash";

const defaults = { x: 10, y: 15 };
const options = { x: 13 };

const expanded = _.defaults(options, defaults);
// valid property access, y has been assigned by defaults
console.log(expanded.y);

// invalid property
console.log(expanded.z);

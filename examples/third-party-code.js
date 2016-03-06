// @flow

import * as _ from "lodash";

const defaults = { x: 10, y: 15 };
const options = { x: 13 };

const expanded = _.defaults(options, defaults);
// valid property access, y has been assigned by defaults
console.log(expanded.y);

// access invalid attribute
console.log(expanded.z);

// accessing not existing attributes is not detected by flow
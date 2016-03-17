[![Coverage
Status](https://coveralls.io/repos/github/DatenMetzgerX/Projektarbeit1/badge.svg?branch=master)](https://coveralls.io/github/DatenMetzgerX/Projektarbeit1?branch=master)
[![bitHound Overall Score](https://www.bithound.io/github/DatenMetzgerX/Projektarbeit1/badges/score.svg)](https://www.bithound.io/github/DatenMetzgerX/Projektarbeit1)
[![Build Status](https://travis-ci.org/DatenMetzgerX/Projektarbeit1.svg?branch=master)](https://travis-ci.org/DatenMetzgerX/Projektarbeit1)

# ESChecker

## Development
The eschecker uses ES6 and needs to be transpiled to ES5 to be runnable on node. The ES6 source code is located in lib folder and can be transpiled using the `npm run build` script or `npm start` to run a watch task that transpiles the files whenever something has changed. The tests use `babel/register` to transpile the code during the execution. The tests can be executed using`npm test`. The code coverage can be calculated using the `npm run coverage` script, which uses `babel-node` and `isparta` to create the coverage over the ES6 source code and not against the ES5-code.



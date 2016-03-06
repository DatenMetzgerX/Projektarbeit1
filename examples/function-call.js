// const not supported

function count(x) {
    return x.length;
}

// missing argument x, x is not optional, dedected
count();

// too many arguments, most probably this cannot be identified as a function might have been replaced?
count("test", "another argument");

function filter(array, condition, context) {
    var result = [];

    for (var i = 0; i < array.length; ++i) {
        if (condition.call(context, array[i])) {
            result.push(array[i]);
        }
    }

    return result;
}

// the first argument of call is not required, so context is optional too. This should not be an error
filter([1, 2, 3, 4], x => x % 2 === 0);

function forEach(array, operation, context) {
    for (var i = 0; i < array.length; ++i) {
        operation.call(context, array[i]);
    }
}

// accessing missing property of result, not found
var filtered = filter([1, 2, 3, 4], x => x % 2 === 0);
console.log(filtered.count);

// accessing result of void function is always undefined, not found
var alwaysUndefined = forEach([1, 2, 3, 4], x => x*x);
console.log(alwaysUndefined.x);
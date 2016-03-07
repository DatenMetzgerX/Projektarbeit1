function count(x) {
    return x.length;
}

// missing argument x, x is not optional
count();

// too many arguments, most probably this cannot be identified as a function might have been replaced?
count("test", "another argument");

function filter(array, condition, context) {
    const result = [];

    for (const element of array) {
        if (condition.call(context, element)) {
            result.push(element);
        }
    }

    return result;
}

// the first argument of call is not required, so context is optional too. This should not be an error
filter([1, 2, 3, 4], x => x % 2 === 0);

function forEach(array, operation, context) {
    for (const element of array) {
        operation.call(context, element);
    }
}

// accessing missing property of result
const filtered = filter([1, 2, 3, 4], x => x % 2 === 0);
console.log(filtered.count);

// accessing result of void function is always undefined
const alwaysUndefined = forEach([1, 2, 3, 4], x => x*x);
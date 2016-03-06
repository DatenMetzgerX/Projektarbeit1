function count(x) {
    return x.length;
}

function defaultOptions() {
    return {
        name: "default" // dead code detected
    };
}

// missing length property for 1, detected
count(1);

// missing version property for option
var options = defaultOptions();
console.log(options.version);

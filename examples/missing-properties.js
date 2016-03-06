function count(x) {
    return x.length;
}

function defaultOptions() {
    return {
        name: "default"
    };
}

// missing length property for 1
count(1);

// missing version property for option
const options = defaultOptions();
console.log(options.version);

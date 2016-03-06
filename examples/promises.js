function asyncFunction () {
    return Promise.resolve("Test");
}

function syncFunction () {
    let result;

    asyncFunction().then(r => result = r);

    // sync access of async result
    return result;
}

function chainedPromise () {
    // warning, then or catch should be called
    asyncFunction();
}


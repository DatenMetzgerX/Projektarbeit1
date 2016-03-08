// calls the parser and extracts the ast for the moment

import fs from "fs";
import resolve from "resolve";
import * as babylon from "babylon";
import traverse from "babel-traverse";
import * as t from "babel-types";

/**
 * Validates the application in the given entry file with all it's dependencies.
 * @param entryFile {string} the path to the entry file of the application to validate
 */
export function validate (entryFile) {
	return parse(entryFile).then(ast => console.log(ast));
}

function parse (file) {
	return readFile(file)
		.then(content => {
			// TODO pass options from a configuration file to babylon to define ecmascript version and so on.
			return babylon.parse(content);
		});
}

/**
 * Reads the file from the given path using the node resolve algorithm to resolve the file
 * @param path {string} the path to the file
 */
function readFile (path) {
	return resolveAbsolutePath(path).then(absolutePath => {
		return new Promise((resolvePromise, rejectPromise) => {
			fs.readFile(absolutePath, "utf8", (error, result) => {
				if (error) {
					rejectPromise(error);
				} else {
					resolvePromise(result);
				}
			});
		});
	});
}

/**
 * Resolves a relative node path to the absolute filesystem path
 * @param relativePath {string} the relative path
 * @returns {Promise} a promise that resolves to the absolute path
 */
function resolveAbsolutePath (relativePath) {
	return new Promise(function (resolvePromise, reject) {
		resolve(relativePath, function (error, result) {
			if (error) {
				reject(error);
			} else {
				resolvePromise(result);
			}
		});
	});
}

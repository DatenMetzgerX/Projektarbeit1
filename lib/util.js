import glob from "glob";
import path from "path";

/**
 * Requires all files that match the passed in pattern
 * @param {String} pattern string pattern that the files need to match to be required. Path is relative to the passed in module
 * @param {Module} module module to which the path should be resolved relative.
 * @returns {Iterator} an iterator over the loaded modules
 */
export function * globRequire(pattern, module) {
	for (const match of glob.sync(pattern, { cwd: path.dirname(module.filename)})) {
		yield module.require(match);
	}
}

/**
 * Requires all files that match the given glob pattern and creates an instance of the default object.
 * @param {string} pattern the glob pattern
 * @param {Module} module module that is used to resolve the paths.
 * @param [args] optional arguments that are passed directly to the constructor
 * @returns {Iterator} an iterator over the created instances
 */
export function * globRequireInstances(pattern, module, ...args) {
	for (const requiredModule of globRequire(pattern, module)) {
		yield new requiredModule.default(...args);
	}
}
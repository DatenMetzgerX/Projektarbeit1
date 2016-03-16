import fs from "fs";
import resolve from "resolve";
import process from "process";

/**
 * Resolver that implements the node module resolution logic.
 */
export class NodeModuleResolution {

	/**
	 * Reads the file from the given path using the node resolve algorithm to resolve the file
	 * @param fileName {string} the path to the file
	 * @return {Promise<string>} the content of the file
	 */
	readFile(fileName) {
		const canoncialName = this.canoncialName(fileName, { });
		return fs.readFileSync(canoncialName, "utf8");
	}

	/**
	 * Resolves a relative node path to the absolute filesystem path
	 * @param fileName {string} the relative path
	 * @returns {Promise} a promise that resolves to the absolute path
	 */
	canoncialName(fileName) {
		return resolve.sync(fileName, { basedir: process.cwd() });
	}
}

export default NodeModuleResolution;
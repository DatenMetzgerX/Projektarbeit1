import assert from "assert";
import Scope from "./scope";
import SourceFile from "./source-file";

export class Program {
	constructor () {
		this.globalScope = new Scope(null);
		this._sourceFiles = new Map();
	}

	getSourceFile(name) {
		return this._sourceFiles.get(name);
	}

	get sourceFiles() {
		return this._sourceFiles.values();
	}

	addSourceFile(sourceFile) {
		assert(!this._sourceFiles.has(sourceFile.path), "The given source file is already included into the program");

		this._sourceFiles.set(sourceFile.path, sourceFile);
	}

	createSourceFile(path, text) {
		return new SourceFile(path, text, this.globalScope);
	}
}

export default Program;
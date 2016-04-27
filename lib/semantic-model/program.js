import assert from "assert";
import Scope from "./scope";
import SourceFile from "./source-file";
import {SymbolTable} from "./symbol-table";
import {addBuiltInVariables} from "./built-in-variables";

/**
 * Semantic representation of a program.
 * A Program consists of multiple source files, a global scope and a symbol table that resolves nodes to there symbol.
 */
export class Program {
	constructor () {
		/**
		 * The global scope that wrapps the global variables of the program
		 * @type {Scope}
         */
		this.globalScope = new Scope(null);
		addBuiltInVariables(this.globalScope);

		/**
		 * The symbol table that resolves nodes to there symbol
		 * @type {SymbolTable}
         */
		this.symbolTable = new SymbolTable();

		this._sourceFiles = new Map();
	}

	/**
	 * Returns the source file belonging to this program with the given name
	 * @param {String} name the name / path of the source file
	 * @returns {SourceFile} the source file with the given name or undefined if the source file is not part of this program
     */
	getSourceFile(name) {
		return this._sourceFiles.get(name);
	}

	/**
	 * Returns all source files that are part of this program
	 * @returns {Iterator.<SourceFile>}
     */
	get sourceFiles() {
		return this._sourceFiles.values();
	}

	/**
	 * Adds a source file to this program
	 * @param {SourceFile} sourceFile the source file to add
	 * @throws if a source file with the given name already exists
     */
	addSourceFile(sourceFile) {
		assert(!this._sourceFiles.has(sourceFile.path), "The given source file is already included into the program");

		this._sourceFiles.set(sourceFile.path, sourceFile);
	}

	/**
	 * Creates a new source file and adds it to the source files that are part of this program.
	 * @param {String} path the normalized path to the source file
	 * @param {String} text the text content of the source file
	 * @returns {SourceFile} the created source file
     */
	createSourceFile(path, text) {
		const sourceFile = new SourceFile(path, text, this.globalScope);
		this.addSourceFile(sourceFile);
		return sourceFile;
	}

	/**
	 * Returns the cfg for the given node
	 * @param {AstNode} node the ast node for which the control flow graph is needed
	 * @returns {ControlFlowGraph} the control flow graph
     */
	getCfg(node) {
		const sourceFile = this.getSourceFile(node.loc.filename);
		return sourceFile.ast.cfg;
	}
}

export default Program;
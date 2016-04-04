import {parse} from "babylon";
import traverse, {visitors} from "babel-traverse";
import codeFrame from "babel-code-frame";

import ParentInitializerVisitor from "./parent-initializer-visitor";
import Scope from "./scope";

export class SourceFile {
	constructor(path, text, globalScope) {
		/**
		 * The path of the file realtive to the project root (can be used to resolve the file)
		 * @type {String}
		 */
		this.path = path;

		/**
		 * The content of the file as text
		 * @type {String}
		 */
		this.text = text;

		/**
		 * The ast representation of the ast after parse has been called
		 * @type {Node}
         */
		this.ast = {};

		/**
		 * The scope that is valid for this file. A source file has always it's own
		 * scope that is a direct child of the global scope.
		 * @type {Scope}
         */
		this.scope = new Scope(globalScope);
	}

	/**
	 * Parses the source code of this file to an ast representation and assigns the ast to {@link SourceFile.ast}.
	 */
	parse() {
		this.ast = parse(this.text, {
			sourceType: "module", // default: "script"
			sourceFilename: this.path
		});
	}

	/**
	 * Executes the given analysers on the ast of this source file
	 * @param analysers the analysers to execute
     */
	analyse(analysers) {
		const astVisitors = [];
		const states = [];

		for (const analyser of [new ParentInitializerVisitor()].concat(analysers)) {
			if (analyser.init) {
				analyser.init();
			}

			astVisitors.push(analyser.visitor);
			states.push(analyser.state);
		}

		const mergedVisitor = visitors.merge(astVisitors, states);
		traverse(this.ast, mergedVisitor);

		analysers.forEach(analyser => {
			if (analyser.complete) {
				analyser.complete();
			}
		});
	}

	/**
	 * Creates a code frame that marks the start position of the passed in node
	 * @param {Node} node the ast node for which the code frame should be shown
	 * @returns {string} the code frame for this node
     */
	codeFrame(node) {
		return codeFrame(this.text, node.loc.start.line, node.loc.start.column, { highlightCode: true });
	}
}

export default SourceFile;
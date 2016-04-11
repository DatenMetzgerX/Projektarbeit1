import TypeEnvironment from "./type-environment";

/**
 * The type inference context provides the context in which the type inference is performed.
 * This is mainly the type environment that defines the types that are refined up to the current position.
 * It provides access to the symbol table and the control flow graph at the other hand
 */
export class TypeInferenceContext {
	/**
	 * Creates a new instance for the type inference of the given program starting with the given type environment.
	 * The type environment will be refined and therefor replaced during the type inference analysis.
	 * @param {Program} program the program for which the analysis is performed
	 * @param {TypeEnvironment} [typeEnvironment=EMPTY] the start type environment for this context
     */
	constructor(program, typeEnvironment=TypeEnvironment.EMPTY) {
		/**
		 * The program for which the type inference is performed
		 * @type {Program}
         */
		this.program = program;

		/**
		 * The type environment that holds the mapping from the symbols to the types that have been inferred up to the current state.
		 * The reference of the type environment changes every time a type has been refined.
		 * @type {TypeEnvironment}
         */
		this.typeEnvironment = typeEnvironment;
	}

	/**
	 * Resolves the type for the given symbol from the type environment
	 * @param {Symbol} symbol the symbol for which the type should be resolved
	 * @returns {Type} the resolved type or undefined
	 */
	getType(symbol) {
		return this.typeEnvironment.getType(symbol);
	}

	/**
	 * Sets the type for the given symbol
	 * @param {Symbol} symbol the symbol for which the type should be set in the type environment
	 * @param {Type} type the type of the symbol
	 */
	setType(symbol, type) {
		this.typeEnvironment = this.typeEnvironment.setType(symbol, type);
	}

	/**
	 * Replaces the type associated with the given symbol in the type environment (and all it's usages in parametrized types).
	 * @param {Symbol} symbol the symbol for which the type should be replaced
	 * @param {function (oldType: Type): Type} callback callback that is invoked with the old type and returns the new type
	 * for the given symbol
	 */
	replaceType(symbol, callback) {
		this.typeEnvironment = this.typeEnvironment.replaceType(symbol, callback);
	}

	/**
	 * Substitutes the type t1 with the type t2
	 * @param {Type} t1 the type that should be substituted
	 * @param {Type} t2 the type that substitutes t1
     */
	substitute(t1, t2) {
		this.typeEnvironment = this.typeEnvironment.substitute(t1, t2);
	}

	/**
	 * Returns the symbol for a node
	 * @param {Node} node the ast node for which the symbol should be retrieved
	 * @returns {Symbol} the symbol for the node or undefined if the node has no symbol (e.g. a binary expression has no symbol)
	 */
	getSymbol(node) {
		return this.program.symbolTable.getSymbol(node);
	}

	/**
	 * Returns the control flow graph for the given node
	 * @param node the node for which the control flow graph is needed
	 * @returns {ControlFlowGraph} the control flow graph
	 */
	getCfg(node) {
		return this.program.getCfg(node);
	}
}
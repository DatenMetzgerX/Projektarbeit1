/**
 * Context with additional parameters passed to the refinement function of a RefinementRule.
 */
export class RefinementContext {
	/**
	 * Creates a new refinement context for the given Hindley Milner instance
	 * @param {HindleyMilner} hindleyMilner the hindley milner instance
	 * @param {TypeInferenceContext} typeInferenceContext the type inference context that is to be used for the refinement
     */
	constructor(hindleyMilner, typeInferenceContext) {
		this._hindleyMilner = hindleyMilner;
		this._typeInferenceContext = typeInferenceContext;
	}

	/**
	 * Infers the type for the given ast node
	 * @param {Node} node the ast node for which the type needs to be determined
	 * @param {TypeInferenceContext} [context=this] the type inference context that should be used to infer the type
	 * @returns {Type} the inferred type for the given name
	 */
	infer(node, context=this._typeInferenceContext) {
		return this._hindleyMilner.infer(node, context);
	}

	/**
	 * Unifies the type t1 and t2
	 * @param {Type} t1 the first type that should be unified
	 * @param {Type} t2 the second type to unify
	 * @param {Node} node the ast node
	 * @returns {Type} the unified type
	 * @throws UnificationError if the unification of type t1 and t2 is not possible.
	 */
	unify(t1, t2, node) {
		return this._hindleyMilner.unify(t1, t2, node, this._typeInferenceContext);
	}

	/**
	 * Resolves the type for the given symbol from the type environment
	 * @param {Symbol} symbol the symbol for which the type should be resolved
	 * @returns {Type} the resolved type or undefined
	 */
	getType(symbol) {
		return this._typeInferenceContext.getType(symbol);
	}

	/**
	 * Sets the type for the given symbol
	 * @param {Symbol} symbol the symbol for which the type should be set in the type environment
	 * @param {Type} type the type of the symbol
	 */
	setType(symbol, type) {
		this._typeInferenceContext.setType(symbol, type);
	}

	/**
	 * Replaces the type associated with the given symbol in the type environment (and all it's usages in parametrized types).
	 * @param {Symbol} symbol the symbol for which the type should be replaced
	 * @param {function (oldType: Type): Type} callback callback that is invoked with the old type and returns the new type
	 * for the given symbol
	 */
	replaceType(symbol, callback) {
		this._typeInferenceContext.replaceType(symbol, callback);
	}

	/**
	 * Returns the symbol for a node
	 * @param {Node} node the ast node for which the symbol should be retrieved
	 * @returns {Symbol} the symbol for the node or undefined if the node has no symbol (e.g. a binary expression has no symbol)
	 */
	getSymbol(node) {
		return this._typeInferenceContext.getSymbol(node);
	}

	/**
	 * Returns the control flow graph for the given node
	 * @param node the node for which the control flow graph is needed
	 * @returns {ControlFlowGraph} the control flow graph
	 */
	getCfg(node) {
		return this._typeInferenceContext.getCfg(node);
	}
}

export default RefinementContext;
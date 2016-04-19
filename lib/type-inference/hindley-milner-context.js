import assert from "assert";
import {RecordType} from "../semantic-model/types";
import {TypeInferenceError} from "./type-inference-error";
import {VoidType, MaybeType} from "../semantic-model/types";

/**
 * Context with additional parameters passed to the refinement function of a RefinementRule
 */
export class HindleyMilnerContext {
	/**
	 * Creates a new refinement context
	 * @param {TypeInferenceAnalysis} typeInferenceAnalysis the type inference analysis
	 * @param {TypeInferenceContext} typeInferenceContext the type inference context that is to be used for the refinement
     */
	constructor(typeInferenceAnalysis, typeInferenceContext) {
		/**
		 * The type inference analysis
		 * @type {TypeInferenceAnalysis}
         * @private
         */
		this._typeInferenceAnalysis = typeInferenceAnalysis;

		/**
		 * The type inference context
		 * @type {TypeInferenceContext}
         * @private
         */
		this._typeInferenceContext = typeInferenceContext;
	}

	/**
	 * Returns the underlining type environment
	 * @returns {TypeEnvironment}
     */
	get typeEnvironment() {
		return this._typeInferenceContext.typeEnvironment;
	}

	/**
	 * Infers the type for the given ast node
	 * @param {Node} node the ast node for which the type needs to be determined
	 * @returns {Type} the inferred type for the given name
	 */
	infer(node) {
		return this._typeInferenceAnalysis.infer(node, this);
	}

	/**
	 * Analyses the given node and all nodes following this node in the control flow graph for all exit paths
	 * @param node the ast node to analyse
     */
	analyse(node) {
		this._typeInferenceContext.typeEnvironment = this._typeInferenceAnalysis.analyse(node, this._typeInferenceContext.typeEnvironment);
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
		return this._typeInferenceAnalysis.unify(t1, t2, node, this);
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
	 * Substitutes type t1 with the type t2
	 * @param {Type} t1 the type to substitute
	 * @param {Type} t2 the substitution for t1
     */
	substitute(t1, t2) {
		this._typeInferenceContext.substitute(t1, t2);
	}

	/**
	 * Returns the object type for the passed in node. The node needs to be a member expression.
	 * The resulting type is a record type (not maybe, null or undefined)
	 * @param node the ast node of the object type
	 * @returns {RecordType} The record type of the node
	 * @throws TypeInferenceError if the type of the node cannot be unified to a record type or if accessing the object
	 * type would result in a null ptr.
     */
	getObjectType(node) {
		const objectSymbol = this.getSymbol(node.object);

		let objectType;
		if (node.object.type === "Identifier") {
			objectType = this.getType(objectSymbol);
		} else if (node.object.type === "MemberExpression") {
			const parentObjectType = this.getObjectType(node.object);
			const parentObjectSymbol = this.getSymbol(node.object.object);
			objectType = parentObjectType.getType(parentObjectSymbol.getMember(node.object.property.name)) || new VoidType();
		} else {
			assert.fail(`Node type ${node.type} for the object of a member expression not yet supported.`);
		}

		const recordType = this.unify(RecordType.ANY, objectType, node.object);
		if (objectType instanceof VoidType || recordType instanceof MaybeType) {
			throw new TypeInferenceError(`Potential null pointer when accessing property ${node.property.name} on null or not initialized object of type ${objectType}.`, node.property);
		}

		return objectType;
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
	 * @param node the ast node
	 * @returns {ControlFlowGraph} the control flow graph
     */
	getCfg(node) {
		return this._typeInferenceContext.getCfg(node);
	}

	/**
	 * Returns a new refinement context that is based on the same type inference context and uses the same hindley milner instance
	 * @returns {HindleyMilnerContext} a new instance of this refinment context
     */
	fresh() {
		return new HindleyMilnerContext(this._typeInferenceAnalysis, this._typeInferenceContext.fresh());
	}
}

export default HindleyMilnerContext;
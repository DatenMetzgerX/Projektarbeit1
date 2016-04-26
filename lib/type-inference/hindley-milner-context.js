import {RecordType, ObjectType, NullType, MaybeType, VoidType, TypeVariable, AnyType} from "../semantic-model/types";
import {TypeInferenceError} from "./type-inference-error";

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
	 * Sets the underlining type environment
	 * @param {TypeEnvironment} value the type environment
     */
	set typeEnvironment(value) {
		this._typeInferenceContext.typeEnvironment = value;
	}

	/**
	 * Infers the type for the given ast node
	 * @param {AstNode} node the ast node for which the type needs to be determined
	 * @returns {Type} the inferred type for the given name
	 */
	infer(node) {
		return this._typeInferenceAnalysis.infer(node, this);
	}

	/**
	 * Analyses the given node and all nodes following this node in the control flow graph for all exit paths
	 * @param {AstNode} node the ast node to analyse
     */
	analyse(node) {
		this._typeInferenceContext.typeEnvironment = this._typeInferenceAnalysis.analyse(node, this._typeInferenceContext.typeEnvironment);
	}

	/**
	 * Unifies the type t1 and t2
	 * @param {Type} t1 the first type that should be unified
	 * @param {Type} t2 the second type to unify
	 * @param {AstNode} node the ast node
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
	 * @param {AstNode} node the ast node of the object type
	 * @returns {RecordType|AnyType} The record type of the node or any type if the type of the object is not known
	 * @throws TypeInferenceError if the type of the node cannot be unified to a record type or if accessing the object
	 * type would result in a null ptr.
     */
	getObjectType(node) {
		const objectType = this.infer(node.object);

		if (objectType instanceof  AnyType) {
			return AnyType.create();
		}

		const recordType = this._toRecordType(objectType, node.object);
		if (objectType instanceof VoidType || recordType instanceof MaybeType) {
			throw new TypeInferenceError(`Potential null pointer when accessing property ${node.property.name} on null or not initialized object of type ${objectType}.`, node.property);
		}

		return recordType;
	}

	/**
	 * Returns the symbol for a node
	 * @param {AstNode} node the ast node for which the symbol should be retrieved
	 * @returns {Symbol} the symbol for the node or undefined if the node has no symbol (e.g. a binary expression has no symbol)
	 */
	getSymbol(node) {
		return this._typeInferenceContext.getSymbol(node);
	}

	/**
	 * Returns the control flow graph for the given node
	 * @param {AstNode} node the ast node
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

	/**
	 * Overrides the types of all symbols of the type environment belonging to this context with the
	 * types from the passed in context.
	 * Mappings from the other context not present in this context are not added.
	 * @param {HindleyMilnerContext} otherContext the context that contains the new mappings
	 * @param {Symbol[]} [excludedSymbols] array with symbols that should not be updated, like THIS or RETURN.
     */
	replaceTypes(otherContext, excludedSymbols) {
		this.typeEnvironment = this.typeEnvironment.replaceTypes(otherContext.typeEnvironment, excludedSymbols);
	}

	_toRecordType(t, node) {
		if (t instanceof RecordType || t instanceof VoidType) {
			return t;
		}

		if (t instanceof TypeVariable) {
			const object = ObjectType.create();
			this.substitute(t, object);
			return object;
		}

		if (t instanceof NullType) {
			return MaybeType.of(ObjectType.create());
		}

		throw new TypeInferenceError(`Type ${t} is not a record type and cannot be converted to a record type, cannot be used as object.`, node);
	}
}

export default HindleyMilnerContext;
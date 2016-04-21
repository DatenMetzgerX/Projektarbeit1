import Immutable from "immutable";
import assert from "assert";

import {globRequireInstances} from "../util";
import TypeUnificator from "./type-unificator";
import {TypeInferenceError} from "./type-inference-error";

/**
 * Interface for a refinement rule used by the Hindley Milner algorithm.
 * A rule implements two methods. The first method indicates if this rule can handle the given type ast node.
 * If this is the case, then the refinement method is responsible for performing the refinment for the given node.
 *
 * @typedef {Object} RefinementRule
 * @interface
 *
 * @property {function (node: Node): boolean} canRefine returns true if this rule can handle the given node, false otherwise
 * @property {function (node: Node, context: HindleyMilnerContext): Type} refine Refines the type for the given node and returns the inferred type
 */

/**
 * Hindley Milner algorithm implementation that infers all the types for a ast node and all it's children.
 * The Hindley Milner algorithm uses a set of rules that perform the refinement. By default, the refinement rules
 * are loaded from the './refinement-rules' directory. Each rule must default export the Rule-Class.
 * In all cases only one rule is allowed to match a node. If more then one rule matches a node, then an error is thrown.
 *
 * The implementation expects that {@link #infer} is called for each statement in the AST. The implementation
 * does not traverse the ast nodes, it does only infer the types on a statement basis (e.g. it infers the types
 * in the test condition of the if statement but it does not infer the types in the consequent and the alternative branch).
 */
export class HindleyMilner {
	/**
	 * Creates a new instance of the hindley milner algorithm.
	 * @param {TypeUnificator} [unificator] the unificator to use for unifying the types
	 * @param {RefinementRule[]} [refinementRules] the rules that should be applied to refine the types
     */
	constructor(unificator=new TypeUnificator(), refinementRules=globRequireInstances("./refinement-rules/*-refinement-rule.js", module)) {

		/**
		 * The unificator used to unify two types
		 * @type {TypeUnificator}
		 */
		this.unificator = unificator;

		/**
		 * The refinement rules used by the algorithm to infer the type
		 * @type {RefinementRule[]}
		 */
		this.refinementRules = Immutable.Set.of(...refinementRules);
	}

	/**
	 * Infers the types for the passed in expression / node and all it's children.
	 * @param {Node} e the node for which the type should be interfered
	 * @param {HindleyMilnerContext} context the context in which the refinement is performed.
	 * @returns {Type} the type of the node.
     */
	infer(e, context) {
		assert(e, "A node for which the types should be inferred is required");
		assert(context, "A type inference context is required");
		return this._getRefinementRule(e).refine(e, context);
	}

	/**
	 * Unifies the passed in types to the most specific common match
	 * @param {Type} t1 the type 1
	 * @param {Type} t2 a second type
	 * @param {Node} node the node for which the unification of the type is performed, needed in error messages
	 * @param {HindleyMilner} context the context for the unification
	 * @returns {Type} the most specific common type if the types are compatible
	 * @throws if the two types cannot be unified, e.g. if one type is a string and another is a number or
	 * if the types are relative to each other (t1=T, t2=S->T, in this case t1 cannot be expressed by T2, neither can t2 be expressed by t1)
     */
	unify(t1, t2, node, context) {
		assert(t1, "The type t1 to unify needs to be specified");
		assert(t2, "The type t2 to unify needs to be specified");
		assert(node, "The node for which the types are to be unified needs to be specified");
		assert(context, "The context for the unification is not optional");

		try {
			const unified = this.unificator.unify(t1, t2);
			if (t1.isTypeVariable && !t1.same(unified)) {
				context.substitute(t1, unified);
			} else if (t2.isTypeVariable && !t2.same(unified)) {
				context.substitute(t2, unified);
			}

			return unified;
		} catch (e) {
			throw new TypeInferenceError(e, node);
		}
	}

	/**
	 * Merges the type environment set on the hindley milner algorithm with the passed
	 * in type environments. Merging means that the resulting type environment contains the definitions of
	 * all type environments, whereas conflicting definitions are unified.
	 * @param {TypeEnvironment[]} others the other type environments with which this environment should be merged
	 * @param node the ast node for which the merge is performed
	 * @param {HindleyMilnerContext} context the type inference context that provides the type environment for the merge
     */
	mergeWithTypeEnvironments(others, node, context) {
		for (const other of others) {
			//noinspection JSAnnotator
			for (const [symbol, type] of other.mappings) {
				const mergedType = context.getType(symbol);
				if (!mergedType) {
					context.setType(symbol, type);
				} else {
					context.substitute(mergedType, this.unify(type, mergedType, node, context));
				}
			}
		}
	}

	_getRefinementRule(node) {
		const possibleRules = this.refinementRules.filter(rule => rule.canRefine(node)).toArray();

		switch (possibleRules.length) {
		case 0:
			throw new TypeInferenceError(`There exists no refinement rule that can handle a node of type ${node.type}.`, node);
		case 1:
			return possibleRules[0];
		default:
			var ruleNames = possibleRules.map(rule => rule.constructor.name).join();
			throw new TypeInferenceError(`The refinement rule to use for a node of type ${node.type} is ambiguous (${ruleNames}).`, node);
		}
	}
}

export default HindleyMilner;
import Immutable from "immutable";
import {globRequireInstances} from "../util";

/**
 * Interface for a base type unification rule.
 * A rule implements two methods. The first method indicates if this rule can handle the given type tuple.
 * If this is the case, then the unification method is responsible for unifiyng the given types.
 *
 * @typedef {Object} BaseTypeUnificationRule
 * @interface
 *
 * @property {function (t1: Type, t2: Type): boolean} canUnify returns true if this rule can handle the given type tuple, false otherwise
 * @property {function (t1: Type, t2: Type, unificator: TypeUnificator): Type} unify unifies the given to types into the most common type and returning this most common type
 */

/**
 * Error thrown if the unification of two types has failed
 */
export class UnificationError extends Error {
	constructor(t1, t2, reason) {
		super(`Unification for type '${t1}' and '${t2}' failed because ${reason}.`);
		/**
		 * One of the types that has been passed to the unification
		 * @type {Type}
		 */
		this.t1 = t1;

		/**
		 * The other type that has been passed to the unification
		 * @type {Type}
		 */
		this.t2 = t2;
	}
}

/**
 * Generic implementation of the Hindley Milner algorithm.
 * The class accepts a set of rules that should be applied to unify two base types.
 * For each type tuple, exactly one rule can handle the unification.
 */
export class TypeUnificator {

	/**
	 * Creates a new instance that uses the passed in unification rules or the default unification rules if no
	 * unification rules have been passed in
	 * @param {BaseTypeUnificationRule[]} [baseTypeUnificationRules] the unification rules to use
     */
	constructor(baseTypeUnificationRules=globRequireInstances("./unification-rules/*.js", module)) {
		this.baseTypeUnificationRules = Immutable.Set.of(...baseTypeUnificationRules);
	}

	/**
	 * Tries to unify the two types and returns the unified type.
	 * @param {Type} t1 the first of the types to unify
	 * @param {Type} t2 the second of the types to unify
	 * @returns {Type} the unified type
	 * @throws UnificationError if the unification of the two types is not possible
     */
	unify(t1, t2) {
		t1 = t1.resolved;
		t2 = t2.resolved;

		// in case the two types are equal, then nothing is to be done
		if (t1.equals(t2)) {
			return t1;
		}

		// both types are base types, base types need to match so that they can be unified
		if (t1.isBaseType && t2.isBaseType) {
			const unified = this._unifyBaseTypes(t1, t2);
			t1.resolvesTo(unified);
			return unified;
		}

		if (t1.isTypeVariable) {
			if (t1.occursIn(t2)) {
				throw new UnificationError(t1, t2, "The type variable of t1 is contained inside of the type t2 and therefore cannot be replaced by t2");
			}

			// t1 is an alias of t2
			t1.resolvesTo(t2);
			return t2;
		}

		// t2 is a type variable, t1 is not, switch the type arguments so that t1 is a type variable and t2 is the base type
		// in this case the rule directly above applies
		return this.unify(t2, t1);
	}

	/**
	 * Tries to unify the given base types by applying one of the base type unification rules.
	 * @param {Type} t1 the first base type
	 * @param {Type} t2 the second base type
	 * @returns {Type} the unified type
     * @private
     */
	_unifyBaseTypes(t1, t2) {
		if (t1.isSameType(t2)) {
			if (t1.typeParameters.size !== t2.typeParameters.size) {
				throw new UnificationError(t1, t2, "the types have a different number of type parameters");
			}

			t1.typeParameters.zip(t2.typeParameters).forEach(([x, y]) => this.unify(x, y));
			return t1;
		}

		return this._getUnificationRuleOrThrow(t1, t2).unify(t1, t2, this);
	}

	_getUnificationRuleOrThrow(t1, t2) {
		let possibleRules = this.baseTypeUnificationRules.filter(rule => rule.canUnify(t1, t2)).toArray();

		switch (possibleRules.length) {
		case 0:
			throw new UnificationError(t1, t2, "there exists no rule that can be used to unify the given types");
		case 1:
			return possibleRules[0];
		default:
			throw new UnificationError(t1, t2, `unification rule to use is ambiguous(${possibleRules.join()})`);
		}
	}
}

export default TypeUnificator;
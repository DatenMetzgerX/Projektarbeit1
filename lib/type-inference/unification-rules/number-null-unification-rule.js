import {NullType, NumberType, MaybeType} from "../../semantic-model/types/index";
/**
 * Unification rule that unifies a number and a null type.
 *
 * E.g. let x = null; x = 5; results in a unification of a null type and a number type. In this case the type is
 * Maybe<number> as the values of x can either be null or any valid number.
 *
 * TODO Maybe this rule can be defined generic for any type T that needs to be unified with Null. Needs further investigation
 *
 * @implements {BaseTypeUnificationRule}
 */
export class NumberNullUnificationRule {
	canUnify(t1, t2) {
		return (t1 instanceof NumberType && t2 instanceof NullType) || (t2 instanceof NumberType && t1 instanceof NullType);
	}

	unify() {
		return new MaybeType(new NumberType());
	}
}

export default NumberNullUnificationRule;
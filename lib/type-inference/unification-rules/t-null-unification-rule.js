import {NullType, VoidType, MaybeType} from "../../semantic-model/types/index";
/**
 * Unification rule that unifies a type T with the null type
 *
 * E.g. let x = null; x = 5; results in a unification of a null type and a number type. In this case the type is
 * Maybe<number> as the values of x can either be null or any valid number.
 *
 * @implements {BaseTypeUnificationRule}
 */
export class TNullUnificationRule {
	canUnify(t1, t2) {
		const {nullType, other} = this._getNullAndOtherType(t1, t2);
		return !!nullType && !(other instanceof MaybeType || other instanceof VoidType);
	}

	unify(t1, t2) {
		const {other} = this._getNullAndOtherType(t1, t2);
		return new MaybeType(other);
	}

	_getNullAndOtherType(t1, t2) {
		const nullType = t1 instanceof NullType ? t1 : t2 instanceof NullType ? t2 : null;
		const other = nullType === t1 ? t2 : t1;
		return { nullType, other };
	}
}

export default TNullUnificationRule;
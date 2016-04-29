import {VoidType, AnyType} from "../../semantic-model/types";

/**
 * Unification rule that unifies a undefined value with any other value.
 * The type always resolves to the other type as this type is more specific than undefined (undefined is just an arbitrary,
 * not yet initialized type).
 *
 * @implements BaseTypeUnificationRule
 */
export class TUndefinedUnificationRule {
	canUnify(t1, t2) {
		const voidType = this._getVoidType(t1, t2);
		return !!voidType.undefined && !(voidType.other instanceof AnyType);
	}

	unify(t1, t2) {
		return t1 instanceof VoidType ? t2 : t1;
	}

	_getVoidType(t1, t2) {
		if (t1 instanceof VoidType) {
			return { undefined: t1, other: t2 };
		}

		if (t2 instanceof VoidType) {
			return { undefined: t2, other: t1 };
		}

		return {};
	}
}

export default TUndefinedUnificationRule;
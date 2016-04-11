import {VoidType} from "../../semantic-model/types";

/**
 * Unification rule that unifies a undefined value with any other value.
 * The type always resolves to the other type as this type is more specific than undefined (undefined is just an arbitrary,
 * not yet initialized type).
 *
 * @implements BaseTypeUnificationRule
 */
export class TUndefinedUnificationRule {
	canUnify(t1, t2) {
		return t1 instanceof VoidType || t2 instanceof VoidType;
	}

	unify(t1, t2) {
		return t1 instanceof VoidType ? t2 : t1;
	}
}

export default TUndefinedUnificationRule;
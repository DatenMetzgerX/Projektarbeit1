import {AnyType} from "../../semantic-model/types";
/**
 * Unification rule that handles the unification of an any type and an other type.
 * The result of the unification of any and T is the concrete type T
 * @implements {BaseTypeUnificationRule}
 */
export class AnyUnificationRule {
	canUnify(t1, t2) {
		return t1 instanceof AnyType || t2 instanceof AnyType;
	}

	unify(t1, t2) {
		return t1 instanceof AnyType ? t2 : t1;
	}
}

export default AnyUnificationRule;
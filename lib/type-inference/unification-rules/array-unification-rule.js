import {ArrayType} from "../../../lib/semantic-model/types";

/**
 * Unification rule for arrays
 * @implements {BaseTypeUnificationRule}
 */
export class ArrayUnificationRule {
	canUnify(t1, t2) {
		return t1 instanceof ArrayType && t2 instanceof ArrayType;
	}

	unify(t1, t2, unificator) {
		return ArrayType.of(unificator.unify(t1.of, t2.of));
	}
}

export default ArrayUnificationRule;
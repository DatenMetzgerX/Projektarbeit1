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
		const unified = ArrayType.of(unificator.unify(t1.of, t2.of));

		if (unified.equals(t1)) {
			return t1;
		}

		if (unified.equals(t2)) {
			return t2;
		}

		return unified;
	}
}

export default ArrayUnificationRule;
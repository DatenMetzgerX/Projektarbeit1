import {UnionType} from "../../semantic-model/types";

/**
 *
 * @implements {BaseTypeUnificationRule}
 */
export class UnionUnificationRule {
	canUnify(t1, t2) {
		return t1 instanceof UnionType || t2 instanceof UnionType;
	}

	unify(t1, t2) {
		return UnionType.union(t1, t2);
	}
}

export default UnionUnificationRule;
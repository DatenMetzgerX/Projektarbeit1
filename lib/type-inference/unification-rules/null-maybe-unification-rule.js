import {MaybeType, NullType} from "../../semantic-model/types/index";
/**
 * Rule that unifies a {@link NullType} and a {@link MaybeType}
 *
 * @implements {BaseTypeUnificationRule}
 */
export class NullMaybeUnificationRule {
	canUnify(t1, t2) {
		return (t1 instanceof NullType && t2 instanceof MaybeType) || (t2 instanceof NullType && t1 instanceof MaybeType);
	}

	unify(t1, t2) {
		return t1 instanceof MaybeType ? t1 : t2;
	}
}

export default NullMaybeUnificationRule;
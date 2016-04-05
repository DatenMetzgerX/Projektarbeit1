import {zip} from "lodash";

import {ParametrizedType} from "../../semantic-model/types/parametrized-type";
import {UnificationError} from "../type-unificator";

/**
 * Unification rule that unifies two parametrized types that are from the same type.
 * Unification of a parametrized type fails if the instances have a different count of type parameters or if any
 * type parameter cannot be unified.
 *
 * @implements {BaseTypeUnificationRule}
 */
export class ParametrizedTypeUnificationRule {
	canUnify(t1, t2) {
		return t1.isSameType(t2) && t1 instanceof ParametrizedType;
	}

	unify(t1, t2, context) {
		if (t1.typeParameters.length !== t2.typeParameters.length) {
			throw new UnificationError(t1, t2, "the parametrized types have a different number of type parameters and therefore cannot be unified");
		}

		zip(t1.typeParameters, t2.typeParameters).forEach(([x, y]) => context.unify(x, y));

		return t1;
	}
}

export default ParametrizedTypeUnificationRule;
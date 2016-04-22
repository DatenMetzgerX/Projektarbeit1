import Immutable from "immutable";
import {ObjectType} from "../../semantic-model/types";

/**
 * Rule for unification of two record types. The unification of two record types is the intersection of the properties with unified types.
 * @implements {BaseTypeUnificationRule}
 */
export class RecordTypeUnificationRule {
	canUnify(t1, t2) {
		return t1 instanceof ObjectType && t2 instanceof ObjectType && t1.constructor === t2.constructor;
	}

	unify(t1, t2, unificator) {
		const smaller = t1.properties.size <= t2.properties.size ? t1 : t2;
		const larger = t1 === smaller ? t2 : t1;

		const commonProperties = smaller.properties.withMutations(map => {
			//noinspection JSAnnotator
			for (const [member, type] of map) {
				const otherType = larger.properties.get(member);
				if (otherType) {
					const unified = unificator.unify(type, otherType);
					if (unified !== type) {
						map.set(member, unified);
					}
				} else {
					map.delete(member);
				}
			}
		});

		if (Immutable.is(commonProperties, smaller.properties)) {
			return smaller;
		}

		return t1.withProperties(commonProperties);
	}
}

export default RecordTypeUnificationRule;
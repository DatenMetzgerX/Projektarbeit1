import Immutable from "immutable";
import {RecordType} from "../../semantic-model/types";

/**
 * Rule for unification of two record types. The unification of two records is the intersection of the properties with unified types.
 * @implements {BaseTypeUnificationRule}
 */
export class RecordUnificationRule {
	canUnify(t1, t2) {
		return t1 instanceof RecordType && t2 instanceof RecordType;
	}

	unify(t1, t2, context) {
		if (t1 === RecordType.ANY) {
			return t2;
		}

		if (t2 === RecordType.ANY) {
			return t1;
		}
		
		const smaller = t1.properties.size <= t2.properties.size ? t1 : t2;
		const larger = t1 === smaller ? t2 : t1;

		const commonProperties = smaller.properties.withMutations(map => {
			for (const [member, type] of map) {
				const otherType = larger.properties.get(member);
				if (otherType) {
					const unified = context.unify(type, otherType);
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

		return new RecordType(commonProperties);
	}
}

export default RecordUnificationRule;
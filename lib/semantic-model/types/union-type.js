import assert from "assert";
import {Type} from "./type";
import {uniqWith, partition, flatMap} from "lodash";

export class UnionType extends Type {
	constructor(...of) {
		assert(Array.isArray(of), "The union types need to be an array");
		super("union", ...of);
	}

	toString() {
		return `union(${this.typeParameters.join(" | ")})`;
	}

	clone() {
		return new UnionType(...this.typeParameters);
	}

	static union(...types) {
		types= [...types].map(t => t.resolveDeep());
		const [unions, nonUnions] = partition(types, t => t instanceof UnionType);
		const allTypes = nonUnions.concat(flatMap(unions, union => union.typeParameters.toArray()));
		const uniqueTypes = uniqWith(allTypes, (t1, t2) => t1.equals(t2));

		if (uniqueTypes.length === 1) {
			return uniqueTypes[0];
		}

		return new UnionType(...uniqueTypes.map(t => t.clone()));
	}
}

export default UnionType;
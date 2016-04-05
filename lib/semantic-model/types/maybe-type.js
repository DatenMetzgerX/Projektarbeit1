import assert from "assert";

import {Type} from "./type";
import {ParametrizedType} from "./parametrized-type";

/**
 * A maybe type of T can either be null, undefined or any value of T.
 */
export class MaybeType extends ParametrizedType {
	/**
	 * Creates a new maybe type of Type `of`
	 * @param of the generic type
	 */
	constructor(of) {
		assert(of instanceof Type, "the generic type argument of needs to be an instance of Type");
		super("Maybe");
		this.of = of;
	}

	get typeParameters() {
		return [this.of];
	}

	set typeParameters(value) {
		assert(value.length === 1, "A maybe type can only have one type parameter");
		[this.of] = value;
	}
}

export default MaybeType;
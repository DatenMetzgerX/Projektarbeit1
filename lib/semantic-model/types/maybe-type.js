import assert from "assert";

import {Type} from "./type";
import {ParametrizedType} from "./parametrized-type";

/**
 * A maybe type of T can either be null, undefined or any value of T.
 */
export class MaybeType extends ParametrizedType {
	/**
	 * Creates a new maybe type of Type `of`
	 * @param {Type} of the generic type
	 * @param [id] the id that identifies this type
	 */
	constructor(of, id) {
		assert(of instanceof Type, "the generic type argument of needs to be an instance of Type");
		super("Maybe", id);
		this.of = of;
	}

	get typeParameters() {
		return [this.of];
	}

	withTypeParameters(value, id) {
		assert(value.length === 1, "A maybe type can only have one type parameter");
		return new MaybeType(value[0], id);
	}
}

export default MaybeType;
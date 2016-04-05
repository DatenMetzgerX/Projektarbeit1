import assert from "assert";

import {Type} from "./type";

/**
 * A maybe type of T can either be null, undefined or any value of T.
 */
export class MaybeType extends Type {
	/**
	 * Creates a new maybe type of Type `of`
	 * @param of the generic type
	 */
	constructor(of) {
		assert(of instanceof Type, "the generic type argument of needs to be an instance of Type");
		super("Maybe", of);
		this.of = of;
	}
}

export default MaybeType;
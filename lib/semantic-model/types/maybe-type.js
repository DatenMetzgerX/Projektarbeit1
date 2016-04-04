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
		super("Maybe", of);
		assert(of, "Generic argument for maybe type is required");
		this.of = of;
	}
}

export default MaybeType;
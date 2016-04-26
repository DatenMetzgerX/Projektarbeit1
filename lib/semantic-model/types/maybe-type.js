import assert from "assert";

import {Type} from "./type";
import {ParametrizedType} from "./parametrized-type";
import {VoidType} from "./void-type";
import {NullType} from "./null-type";
import {NumberType} from "./number-type";

let maybeNumber;

/**
 * A maybe type of T can either be null, undefined or any value of T.
 */
export class MaybeType extends ParametrizedType {

	/**
	 * Creates a new maybe type of the given type
	 * @param {Type} t the type of which the maybe type is
	 * @returns {MaybeType} the created maybe type
     */
	static of(t) {
		if (t instanceof NumberType) {
			return (maybeNumber = maybeNumber || new MaybeType(NumberType.create()));
		}

		return new MaybeType(t);
	}

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

	/**
	 * A type t is a subtype of the maybe type if the type is void, null or is a subtype of the type wrapped by the maybe.
	 * Void and null need to be subtypes to allow absent function parameters to be passed as undefined
	 * @param {Type} t the type of the type to test if it is a sub type of this maybe type
	 * @returns {boolean} true if t is a subtype
     */
	isSubType(t) {
		return super.isSubType(t) || t instanceof NullType || t instanceof VoidType || this.of.isSubType(t);
	}
}

export default MaybeType;
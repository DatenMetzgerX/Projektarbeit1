import {Type} from "./type";

/**
 * Type variable represents a not yet known type.
 */
export class TypeVariable extends Type {
	constructor(id) {
		super("@", id);
	}

	get isTypeVariable() {
		return true;
	}

	get prettyName() {
		return `${super.prettyName} (${this.id})`;
	}

	fresh() {
		return new TypeVariable();
	}

	/**
	 * Tests if this variable is equal to the other variable.
	 * The equality of a type variable is defined by it's reference, so a type variable is only equal to itself.
	 * @param {Type} other the other type to which it should be compared to
     */
	equals(other) {
		return super.same(other);
	}
}

export default TypeVariable;
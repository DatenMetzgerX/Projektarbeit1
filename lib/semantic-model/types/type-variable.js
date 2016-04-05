import {Type} from "./type";

let varCounter = 0;

/**
 * Type variable represents a not yet known type.
 */
export class TypeVariable extends Type {
	constructor() {
		super("@");
	}

	get isTypeVariable() {
		return true;
	}

	/**
	 * Creates a unique id for this type variable (lazy)
	 * @returns {number} the id of this variable
	 */
	get id() {
		if (!this._id) {
			this._id = ++varCounter;
		}

		return this._id;
	}

	get prettyName() {
		return `${super.prettyName} (${this.id})`;
	}

	/**
	 * Tests if this variable is equal to the other variable.
	 * The equality of a type variable is defined by it's reference, so a type variable is only equal to itself.
	 * @param {Type} other the other type to which it should be compared to
     */
	equals(other) {
		return this === other;
	}
}

export default TypeVariable;
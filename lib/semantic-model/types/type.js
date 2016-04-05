import assert from "assert";

/**
 * Base class for all types
 */
export class Type {
	constructor(name) {
		assert(typeof(name) === "string", "the name needs to be a string");

		this.name = name;
	}

	/**
	 * Returns a pretty representation for the type name. A record type might want to include all the properties
	 * in it's name
	 * @returns {String}
     */
	get prettyName() {
		return this.name;
	}

	/**
	 * Returns the final resolved type
	 * @returns {Type}
	 */
	get resolved() {
		return this._resolved ? this._resolved.resolved : this;
	}

	/**
	 * Indicator if this is a type variable or not
	 * @returns {boolean} true if it is a variable
	 */
	get isTypeVariable() {
		return false;
	}

	/**
	 * Returns true if this is a base type (concrete type)
	 * @returns {boolean}
	 */
	get isBaseType() {
		return !this.isTypeVariable;
	}

	/**
	 * Resolves this type to the given type
	 * @param {Type} type the type to which this type resolves to
	 */
	resolvesTo(type) {
		if (this === type) {
			return;
		}

		this._resolved = type;
	}

	/**
	 * Resolves this type and replaced all type parameters with their replaced pendants.
	 * This method has a side effects on the resolved type.
	 * @returns {Type} the resolved type that has also all type parameters resolved.
	 */
	resolveDeep() {
		return this.resolved;
	}

	/**
	 * Reverse operation of occurs.
	 * @param {Type} t2 type to test that should be part of this
	 * @returns {boolean} true if t2 is a part of the this type
     */
	containsType(t2) {
		return this === t2;
	}

	/**
	 * Tests if this type occurres in the passed in type. E.g. in the case
	 * this=S, and t2=S->T, in this case, this type is parat of the type t2.
	 * This is also the case if t2 is a parametrized type and this is a part of
	 * a type parameter.
	 * @param {Type} t2 type that should be checked if this type is a part of
	 * @returns {boolean} true if this type is part of the type t2.
	 */
	occursIn(t2) {
		return t2.containsType(this);
	}

	/**
	 * Returns a string representation of the type.
	 * Returns the description of the type by default. If the type
	 * resolves to another type, then this is expressed by an arrow.
	 * @returns {string} the string representation of the type
	 */
	toString() {
		let name = this.prettyName;

		if (this._resolved) {
			return `${name} -> ${this._resolved}`;
		}

		return name;
	}

	/**
	 * Tests if this type is from the same kind as the other type, ignoring type paraemters.
	 * @param {Type} other the other type
	 * @returns {boolean} true if both types are from the same kind, e.g. both types are
	 * NumberTypes or both types are MaybeTypes<?>. Also returns true if one type is Maybe<number>
	 *     but the other is Maybe<string>. To verify if the type is equal including the type parameters
	 *     use equals
	 */
	isSameType(other) {
		return this.constructor === other.constructor;
	}

	/**
	 * Tests if this type is strictly equal with another type.
	 * Two types are strictly equal if they are from the same kind and all type parameters
	 * are strictly equal.
	 * @param {Type} other to which type this type should be compared to
	 * @returns {boolean} true if the types are strictly equal
	 */
	equals(other) {
		if (this === other) {
			return true;
		}

		return this.isSameType(other);
	}
}

export default Type;
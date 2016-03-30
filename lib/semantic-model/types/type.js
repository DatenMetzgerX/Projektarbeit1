import Immutable from "immutable";

/**
 * Base class for all types
 */
export class Type {
	constructor(name, ...typeParameters) {
		this.name = name;
		this.typeParameters = Immutable.List.of(...typeParameters);
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
		const resolved = this.resolved;
		resolved.typeParameters = resolved.typeParameters.map(parameter => parameter.resolveDeep());
		return resolved;
	}

	/**
	 * Tests if this type occurres in the passed in type. E.g. in the case
	 * this=S, and t2=S->T, in this case, this type is parat of the type t2.
	 * This is also the case if t2 is a parametrized type and this is a part of
	 * a type parameter.
	 * @param {Type} t2 type that should be checked if this type is a part of
	 * @returns {true} true if this type is part of the type t2.
	 */
	occursIn(t2) {
		if (this === t2) {
			return true;
		}

		return t2.typeParameters.some(type => this.occursIn(type));
	}

	/**
	 * Returns a string representation of the type.
	 * Returns the description of the type by default. If the type
	 * resolves to another type, then this is expressed by an arrow.
	 * @returns {string} the string representation of the type
	 */
	toString() {
		let name = this.name;

		if (this.typeParameters.size > 0) {
			name += `<${this.typeParameters.join(", ")}>`;
		}

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

		if (!this.isSameType(other)) {
			return false;
		}

		if (this.typeParameters.size !== other.typeParameters.size) {
			return false;
		}

		return this.typeParameters.zip(other.typeParameters).every(([t1, t2]) => t1.equals(t2));
	}
}

export default Type;
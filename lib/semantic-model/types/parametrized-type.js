import {zip} from "lodash";
import assert from "assert";
import Immutable from "immutable";
import {Type} from "./type";

/**
 * Generic base class for parametrized types like Maybe<T> or Function<TThis, TParam, TReturn>.
 * Overrides the most important functions. Subclasses need to have a property `typeParameters` that returns an array with all type parameters and
 * implement the function `withTypeParameters`.
 * @property {Type[]} typeParameters the type parameters for this type
 */
export class ParametrizedType extends Type {

	/**
	 * Returns a prettier representation of a parametrized type that includes the name and all it's parametrized types.
	 * @returns {string}
	 */
	get prettyName() {
		return `${super.prettyName}<${this.typeParameters.join(", ")}>`;
	}

	fresh() {
		return this.withTypeParameters(this.typeParameters);
	}

	/**
	 * Returns true if t is of the same type and all type parameters of t are a subtype of the parameter types from this type
	 * @param {Type} t the type to determine if it is a subtype
	 * @returns {boolean} true if it is a subtype, false otherwise
     */
	isSubType(t) {
		if (this.constructor === t.constructor) {
			return zip(this.typeParameters, t.typeParameters).every(([t1, t2]) => t1.isSubType(t2));
		}

		return false;
	}

	/**
	 * Returns a new type that uses the given type parameters instead of the current type parameters
	 * @param {Type[]} typeParameters the new type parameters to use
	 * @param [id] the id of the returned type
	 * @returns {Type} a new type with the given type parameters
	 * @abstract
     */
	/* istanbul ignore next */
	withTypeParameters(typeParameters, id) { // eslint-disable-line no-unused-vars
		assert.fail("abstract function withTypeParameters");
	}

	substitute(oldType, newType) {
		if (this.same(oldType)) {
			return newType;
		}

		const typeParameters = Immutable.fromJS(this.typeParameters);
		const substituted = typeParameters.map(param => param.substitute(oldType, newType));

		// type parameters have not changed
		if (Immutable.is(typeParameters, substituted)) {
			return this;
		}

		return this.withTypeParameters(substituted.toArray(), this.id);
	}

	/**
	 * Tests if t2 is equal to this type or part of any type parameter
	 * @param {Type} t2 type to test
	 * @returns {boolean} true if t2 is part of this type definition
     */
	containsType(t2) {
		if (super.containsType(t2)) {
			return true;
		}

		return this.typeParameters.some(type => type.containsType(t2));
	}

	/**
	 * Tests if this type is strictly equal with the passed in type. Two parametrized types are strictly equal they are equal
	 * according to {@link Type.equals} and all type parameters are equal too
	 * @param {Type} other the other type to which it should be compared to
	 * @returns {boolean} true if the parametrized types are equal
     */
	equals(other) {
		if (!super.equals(other)) {
			return false;
		}

		if (this.typeParameters.length !== other.typeParameters.length) {
			return false;
		}

		return zip(this.typeParameters, other.typeParameters).every(([t1, t2]) => t1.equals(t2));
	}
}
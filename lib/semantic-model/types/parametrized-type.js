import {zip} from "lodash";
import {Type} from "./type";

/**
 * Generic base class for parametrized types like Maybe<T> or Function<TThis, TParam, TReturn>.
 * Overrides the most important functions. Subclasses need to have a property typeParameters.
 * @abstract
 */
export class ParametrizedType extends Type {

	/**
	 * Returns a prettier representation of a parametrized type that includes the name and all it's parametrized types.
	 * @returns {string}
	 */
	get prettyName() {
		return `${super.prettyName}<${this.typeParameters.join(", ")}>`;
	}

	/**
	 * Performs a deep resolution of the type including resolving all type parameters
	 * @returns {Type} the resolved type
     */
	resolveDeep() {
		const resolved = super.resolveDeep();
		resolved.typeParameters = resolved.typeParameters.map(parameter => parameter.resolveDeep());
		return resolved;
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
	 * Tests if this type is strictly equal with the passed in type. Two parameterized types are strictly equal they are equal
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
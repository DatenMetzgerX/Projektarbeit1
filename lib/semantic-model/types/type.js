import assert from "assert";
import {uniqueId} from "lodash";

/**
 * Base class for all types.
 * @immutable
 */
export class Type {
	/**
	 * Creates a new type instance
	 * @param {string} name the name of the type
	 * @param [id=uniqueId()] an optional id that identifies this type instance, new unique value if not present
     */
	constructor(name, id=uniqueId()) {
		assert(typeof(name) === "string", "the name needs to be a string");

		/**
		 * Name that identifies the kind of the type, e.g. number, string
		 * @type {string}
		 */
		this.name = name;

		/**
		 * Unique id that identifies the type instance. Multiple type object instances can have the same id.
		 * All this object instance belong to the same type instance and are therefore the same according to {@link Type.same}.
		 */
		this.id = id;
	}

	/**
	 * Returns a pretty representation for the type name. A record type might want to include all the properties
	 * in it's name
	 * @type {String}
     */
	get prettyName() {
		return this.name;
	}

	/**
	 * Indicator if this is a type variable or not
	 * @type {boolean}
	 */
	get isTypeVariable() {
		return false;
	}

	/**
	 * Returns true if this is a base type (concrete type)
	 * @type {boolean}
	 */
	get isBaseType() {
		return !this.isTypeVariable;
	}

	/**
	 * Returns a new instance that is equal to this instance but does not share the same instance id
	 * @returns {Type} a new instance of this type with a new unique id
	 */
	fresh() {
		return new this.constructor(this.name);
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
	 * Substitutes all occurrences of `oldType` with the `newType`
	 * @param {Type} oldType the old type from which all occurrences should be substituted with `newType`
	 * @param {Type} newType the new type that substitutes the `oldType`
	 * @returns {Type} the type where the old type is substituted with the new type. The returned type has the same id has this type.
     */
	substitute(oldType, newType) { // eslint-disable-line no-unused-vars
		if (this.same(oldType)) {
			return newType;
		}

		return this;
	}

	/**
	 * Tests if this type is from the same kind as the other type, ignoring type parameters.
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
	 * Tests if this is the same type as another type. The object reference is not sufficient in the case that
	 * a type is used inside another type and is substituted later by another type. In this case, the substituted type
	 * in the type environment is another instance than the type substituted inside of `another` type. Therefore two types
	 * are equal if they share the same id (if referential equality is given).
	 * @param {Type} other the other type that might be the same as this type
	 * @returns {boolean} true if the both types are exaclty the same
     */
	same(other) {
		return this === other || this.id === other.id;
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

	/**
	 * Returns a string representation of the type.
	 * Returns the description of the type by default. If the type
	 * resolves to another type, then this is expressed by an arrow.
	 * @returns {string} the string representation of the type
	 */
	toString() {
		return this.prettyName;
	}
}

export default Type;
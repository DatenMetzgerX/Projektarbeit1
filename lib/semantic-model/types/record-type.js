import assert from "assert";
import Immutable from "immutable";
import {Type} from "./type";
import {Symbol} from "../symbol";

const EMPTY_PROPERTIES_MAP = new Immutable.Map();

/**
 * A record type consists of null or multiple properties. A property has, for this record, unique name and a type.
 * The name is represented by a symbol.
 */
export class RecordType extends Type {

	/**
	 * Creates a new record type pre initialized with the given properties
	 * @param {Array<Array<>>} properties array containing the properties. Each array entry is a tuple of symbol to type,
	 * e.g. [[name, nameType], [age, ageType]]
	 * @returns {RecordType} The created record type that has the given properties
	 */
	static withProperties(properties=[]) {
		const map = new Immutable.Map(properties.map(([symbol, type]) => [new Member(symbol), type]));
		return new RecordType(map);
	}

	/**
	 * Creates a new record type
	 * @param {Map<Member, Type>} [properties] the properties of this record
	 * @param [id] optional id
     */
	constructor(properties=EMPTY_PROPERTIES_MAP, id=undefined) {
		super("record", id);
		this.properties = properties;
	}

	/**
	 * Returns a string representation that is similar to the one js uses for object literals with the difference
	 * that it is limited to a single line.
	 * @returns {string}
	 */
	get prettyName() {
		const properties = [...this.properties].map(([member, type]) => `${member.symbol}: ${type}`).join(", ");
		return `{${properties}}`;
	}

	fresh() {
		return new RecordType(this.properties);
	}

	/**
	 * Returns true if the record has a property with the given symbol
	 * @param {Symbol} symbol the symbol of the property
	 * @returns {boolean} true if a property with the given symbol exists
     */
	hasProperty(symbol) {
		return this.properties.has(new Member(symbol));
	}

	/**
	 * Adds a property for the given symbol
	 * @param {Symbol} symbol the symbol that identifies the property
	 * @param {Type} type the type of the property
	 * @throws if a property for the given symbol already exists
	 * @returns {RecordType} new record type that has the new property
     */
	addProperty(symbol, type) {
		assert(symbol instanceof Symbol, "the property symbol needs to be typeof Symbol");
		assert(type instanceof Type, "Type needs to be an instanceof type");
		assert(!this.hasProperty(symbol), "A property with the given name already exists");

		return new RecordType(this.properties.set(new Member(symbol), type));
	}

	/**
	 * Returns the type of the property with the given symbol
	 * @param {Symbol} symbol the symbol that identifies he property
	 * @returns {Type} the type of the property or undefined if no such property exists
     */
	getType(symbol) {
		return this.properties.get(new Member(symbol));
	}

	/**
	 * Updates the type of a property
	 * @param {Symbol} symbol the symbol that identifies the property to update
	 * @param {Type} type the new type
	 * @returns {RecordType} the record where the type of the property has been changed to the new type
     */
	setType(symbol, type) {
		assert(symbol instanceof Symbol, "the property symbol needs to be typeof Symbol");
		assert(type instanceof Type, "The type needs to be an instance of Type");
		assert(this.hasProperty(symbol), "property does not yet exist, to add new properties use add property");

		return new RecordType(this.properties.set(new Member(symbol), type));
	}

	substitute(oldType, newType) {
		if (this.same(oldType)) {
			return newType;
		}

		const mutated = this.properties.withMutations(map => {
			//noinspection JSAnnotator
			for (const [member, type] of map) {
				const substituted = type.substitute(oldType, newType);
				if (substituted !== type) {
					map.set(member, type.substitute(oldType, newType));
				}
			}
		});

		if (mutated.equals(this.properties)) {
			return this;
		}

		return new RecordType(mutated);
	}

	/**
	 * Returns true if the type is equal to this or is used in any of the properties
	 * @param {Type} t2 type to check if it is used in this record type definition
	 * @returns {boolean} true if the type is used to define the record type
     */
	containsType(t2) {
		if (super.containsType(t2)) {
			return true;
		}

		for (const propertyType of this.properties.values()) {
			if (propertyType.containsType(t2)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns true if the other record defines exactly the same properties and all those properties have the same type
	 * @param {Type} other the other type
	 * @returns {boolean} true if the records are equal
     */
	equals(other) {
		if (!super.equals(other)) {
			return false;
		}

		return Immutable.is(this.properties, other.properties);
	}
}

/**
 * Sentinel value that can be used when requesting an arbitrary record type.
 * This is useful when a type needs to be a record type but it is not important what properties this record type has.
 * Then this instance can be used to unify the other type with this type to get any record type
 * @type {RecordType}
 */
RecordType.ANY = new RecordType();

/**
 * Wrapper for a symbol. Two members are equal if they have the same name and not if they are the same instance.
 */
class Member {
	/**
	 * Creates a new member for the given symbol
	 * @param {Symbol} symbol the symbol to wrap
     */
	constructor(symbol) {
		this.symbol = symbol;
	}

	valueOf() {
		return this.symbol.name;
	}
}

export default RecordType;
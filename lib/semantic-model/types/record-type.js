import assert from "assert";
import Immutable from "immutable";

import {Type} from "./type";
import {AnyType} from "./any-type";
import {Symbol, SymbolFlags} from "../symbol";

const EMPTY_PROPERTIES_MAP = new Immutable.Map();

/**
 * A record type consists of null or multiple properties. A property has, for this record, unique name and a type.
 * The name is represented by a symbol.
 */
export class RecordType extends Type {

	/**
	 * Creates a new record type pre initialized with the given properties
	 * @param {function(properties: Immutable.Map<Member, Type>): RecordType} ctor constructor function of the type to instantiate
	 * @param {Array.<Array.<?>>} properties array containing the properties. Each array entry is a tuple of symbol to type,
	 * e.g. [[name, nameType], [age, ageType]]
	 * @returns {RecordType} The created record type that has the given properties
	 */
	static create(ctor, properties=[]) {
		const map = new Immutable.Map(properties.map(([symbol, type]) => [new Member(symbol), type]));
		return new ctor(map);
	}

	/**
	 * Creates a new record type
	 * @param {Map.<Member, Type>} [properties] the properties of this record
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

	/**
	 * T is a subtype of this, if it contains the same properties and the types of all properties are a subtype of the
	 * properties from this.
	 * @param {Type} t type to check if it is a subtype
	 * @returns {boolean} true if t is a subtype
     */
	isSubType(t) {
		if (this.constructor !== t.constructor) {
			return false;
		}

		for (const [member, propertyType] of this.properties) {
			const tPropertyType = t.getType(member.symbol);
			if (!tPropertyType || !propertyType.isSubType(tPropertyType)) {
				return false;
			}
		}

		return true;
	}

	fresh() {
		return this.withProperties(this.properties);
	}

	/**
	 * Returns true if the record has a property with the given symbol
	 * @param {Symbol} symbol the symbol of the property
	 * @returns {boolean} true if a property with the given symbol exists
     */
	hasProperty(symbol) {
		// Might be, don't know
		if ((symbol.flags & SymbolFlags.Computed) === SymbolFlags.Computed) {
			return true;
		}

		return this.properties.has(new Member(symbol));
	}

	/**
	 * Adds a property for the given symbol
	 * @param {Symbol} symbol the symbol that identifies the property
	 * @param {Type} type the type of the property
	 * @throws if a property for the given symbol already exists
	 * @returns {RecordType} new record type that has the new property with the same id
     */
	addProperty(symbol, type) {
		assert(symbol instanceof Symbol, "the property symbol needs to be typeof Symbol");
		assert(type instanceof Type, "Type needs to be an instanceof type");
		assert(!this.hasProperty(symbol), `A property with the name '${symbol.name}' already exists`);

		return this.withProperties(this.properties.set(new Member(symbol), type), this.id);
	}

	/**
	 * Returns the type of the property with the given symbol
	 * @param {Symbol} symbol the symbol that identifies he property
	 * @returns {Type} the type of the property or undefined if no such property exists
     */
	getType(symbol) {
		if ((symbol.flags & SymbolFlags.Computed) === SymbolFlags.Computed) {
			return AnyType.create();
		}

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

		if ((symbol.flags & SymbolFlags.Computed) === SymbolFlags.Computed) {
			return this;
		}

		return this.withProperties(this.properties.set(new Member(symbol), type), this.id);
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

		return this.withProperties(mutated, this.id);
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

	/**
	 * Returns a new instance that is equal to this, except that it uses the given properties
	 * @param {Immutable.Map<Member, Type>} properties the properties
	 * @param id the id of the new instance
	 * @returns {RecordType} a new record type with the given properties
     */
	withProperties(properties, id) {
		return new this.constructor(properties, id);
	}
}

/**
 * Wrapper for a symbol. Two members are equal if they have the same name and not if they are the same instance.
 */
class Member {
	/**
	 * Creates a new member for the given symbol
	 * @param {Symbol} symbol the symbol to wrap
     */
	constructor(symbol) {
		assert(symbol, "A symbol is required to create a member");
		this.symbol = symbol;
	}

	valueOf() {
		return this.symbol.name;
	}
}

export default RecordType;
import assert from "assert";
import {Type} from "./type";
import {Symbol} from "../symbol";

/**
 * A record type consists of null or multiple properties. A property has, for this record, unique name and a type.
 * The name is represented by a symbol.
 */
export class RecordType extends Type {
	constructor() {
		super("record");

		this.properties = new Map();
	}

	/**
	 * Returns a string representation that is similar to the one js uses for object literals with the difference
	 * that it is limited to a single line.
	 * @returns {string}
	 */
	get prettyName() {
		const properties = [...this.properties].map(([symbol, type]) => `${symbol}: ${type}`).join(", ");
		return `{${properties}}`;
	}

	/**
	 * Returns true if the record has a property with the given symbol
	 * @param {Symbol} symbol the symbol of the property
	 * @returns {boolean} true if a property with the given symbol exists
     */
	hasProperty(symbol) {
		return this.properties.has(symbol);
	}

	/**
	 * Adds a property for the given symbol
	 * @param {Symbol} symbol the symbol that identifies the property
	 * @param {Type} type the type of the property
	 * @throws if a property for the given symbol already exists
     */
	addProperty(symbol, type) {
		assert(symbol instanceof Symbol, "the property symbol needs to be typeof Symbol");
		assert(type instanceof Type, "Type needs to be an instanceof type");
		assert(!this.properties.has(symbol), "A property with the given name already exists");

		this.properties.set(symbol, type);
	}

	/**
	 * Returns the type of the property with the given symbol
	 * @param {Symbol} symbol the symbol that identifies he property
	 * @returns {Type} the type of the property or undefined if no such property exists
     */
	getType(symbol) {
		return this.properties.get(symbol);
	}

	/**
	 * Updates the type of a property
	 * @param {Symbol} symbol the symbol that identifies the property to update
	 * @param {Type} type the new type
     */
	setType(symbol, type) {
		assert(symbol instanceof Symbol, "the property symbol needs to be typeof Symbol");
		assert(type instanceof Type, "The type needs to be an instance of Type");
		assert(this.properties.has(symbol), "property does not yet exist, to add new properties use add property");

		this.properties.set(symbol, type);
	}

	/**
	 * Resolves itself and all its properties to the resolved type
	 * @returns {Type} the resolved type
     */
	resolveDeep() {
		const resolved = super.resolveDeep();

		resolved.properties.forEach((type, symbol) => resolved.properties.set(symbol, type.resolveDeep()));
		return resolved;
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

		if (this.properties.size !== other.properties.size) {
			return false;
		}

		for (const [symbol, type] of this.properties) {
			const otherType = other.getType(symbol);

			if (!otherType || !otherType.equals(type)) {
				return false;
			}
		}

		return true;
	}
}

export default RecordType;
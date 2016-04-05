import assert from "assert";
import {Type} from "./type";

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
		const properties = [...this.properties].map(([name, type]) => `${name}: ${type}`).join(", ");
		return `{${properties}}`;
	}

	/**
	 * Returns true if the record has a property with the given name
	 * @param {String} name the name of the property
	 * @returns {boolean} true if a property with the given name exists
     */
	hasProperty(name) {
		return this.properties.has(name);
	}

	/**
	 * Adds a property with the given name and type.
	 * @param {String} name the name of the property
	 * @param {Type} type the type of the property
	 * @throws if a property with the given name already exists
     */
	addProperty(name, type) {
		assert(typeof(name) === "string", "the type of a property name needs to be a string");
		assert(type instanceof Type, "Type needs to be an instanceof type");
		assert(!this.properties.has(name), "A property with the given name already exists");

		this.properties.set(name, type);
	}

	/**
	 * Returns the type of the property with the given name
	 * @param {String} name the name of the property
	 * @returns {Type} the type of the property or undefined if no property with the given name exists
     */
	getType(name) {
		return this.properties.get(name);
	}

	/**
	 * Resolves itself and all its properties to the resolved type
	 * @returns {Type} the resolved type
     */
	resolveDeep() {
		const resolved = super.resolveDeep();

		resolved.properties.forEach((type, name) => resolved.properties.set(name, type.resolveDeep()));
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

		for (const [name, type] of this.properties) {
			const otherType = other.getType(name);

			if (!otherType || !otherType.equals(type)) {
				return false;
			}
		}

		return true;
	}
}

export default RecordType;
import {RecordType} from "./record-type";

/**
 * The object type represents objects created by object expressions or function constructors
 */
export class ObjectType extends RecordType {
	/**
	 * Creates a new record type pre initialized with the given properties
	 * @param {Array<Array<>>} properties array containing the properties. Each array entry is a tuple of symbol to type,
	 * e.g. [[name, nameType], [age, ageType]]
	 * @returns {RecordType} The created record type that has the given properties
	 */
	static create(properties) {
		return RecordType.create(ObjectType, properties);
	}
}
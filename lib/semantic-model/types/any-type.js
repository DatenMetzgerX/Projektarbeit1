import {Type} from "./type";

export class AnyType extends Type {

	static create() {
		return instance;
	}

	constructor() {
		super("any");
	}

	/**
	 * Any is the base type, all other types are subtypes of any
	 * @returns {boolean} true
     */
	isSubType() {
		return true;
	}
}

const instance = new AnyType();

export default AnyType;
import {Type} from "./type";

export class AnyType extends Type {
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

export default AnyType;
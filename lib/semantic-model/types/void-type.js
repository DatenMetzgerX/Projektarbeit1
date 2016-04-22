import {Type} from "./type";

/**
 * undefined
 */
export class VoidType extends Type {
	constructor() {
		super("undefined");
	}

	isSubType() {
		return true; // Any type is a subtype of the void type as void can be assigned to any value (difference to any type?)
	}
}

export default VoidType;
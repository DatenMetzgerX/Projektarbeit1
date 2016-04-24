import {Type} from "./type";

/**
 * true / false
 */
export class BooleanType extends Type {

	static create() {
		return instance;
	}

	constructor() {
		super("boolean");
	}
}

const instance = new BooleanType();

export default BooleanType;
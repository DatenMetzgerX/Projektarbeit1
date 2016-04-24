import {Type} from "./type";

/**
 * number
 */
export class NumberType extends Type {

	static create() {
		return instance;
	}

	constructor() {
		super("number");
	}
}

const instance = new NumberType();

export default NumberType;
import {Type} from "./type";

/**
 * null
 */
export class NullType extends Type {

	static create() {
		return instance;
	}

	constructor() {
		super("null");
	}
}

const instance = new NullType();

export default NullType;
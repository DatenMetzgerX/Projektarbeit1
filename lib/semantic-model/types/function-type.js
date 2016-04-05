import assert from "assert";
import {Type} from "./type";
import {ParametrizedType} from "./parametrized-type";

/**
 * function (this, params) where this is modeled as explicit parameter of the function
 */
export class FunctionType extends ParametrizedType {
	constructor(thisType, params, returnType) {
		assert(thisType === null || thisType instanceof Type, "the this type needs to be a type instance");
		assert(Array.isArray(params), "the function parameters need to be an array");
		assert(returnType instanceof Type, "the return type needs to be a type instance");

		super("Function");
		this.thisType = thisType;
		this.params = params;
		this.returnType = returnType;
	}

	get typeParameters() {
		return [this.thisType, this.returnType, ...this.params];
	}

	set typeParameters(value) {
		assert(value.length > 2, "The type parameters require at least a length of two");

		[this.thisType, this.returnType, ...this.params] = value;
	}

	/**
	 * Returns a prettier representation of the function name that includes the this and return type and also all parameter types
	 * @returns {string} the pretty name
	 */
	get prettyName() {
		return `${this.thisType}.(${this.params.join(", ")}) -> ${this.returnType}`;
	}
}

export default FunctionType;
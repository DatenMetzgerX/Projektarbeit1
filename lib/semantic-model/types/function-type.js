import assert from "assert";
import {Type} from "./type";

/**
 * function (this, params) where this is modeled as explicit parameter of the function
 */
export class FunctionType extends Type {
	constructor(thisType, params, returnType) {
		assert(thisType === null || thisType instanceof Type, "the this type needs to be a type instance");
		assert(Array.isArray(params), "the function parameters need to be an array");
		assert(returnType instanceof Type, "the return type needs to be a type instance");

		super("Function", thisType, ...params, returnType);
	}

	/**
	 * Returns an Iterable containing the types of the function parameters
	 * @returns {Iterable<Type>}
     */
	get parameterTypes() {
		return this.typeParameters.skip(1).butLast();
	}

	/**
	 * Returns the type of this
	 * @returns {Type}
     */
	get thisType() {
		return this.typeParameters.get(0);
	}

	/**
	 * Returns the return type of the function
	 * @returns {Type}
     */
	get returnType() {
		return this.typeParameters.get(this.typeParameters.size - 1);
	}

	/**
	 * Returns a string representation of the function type
	 * @returns {string} the string reprsentation
     */
	toString() {
		return `${this.thisType}.(${this.parameterTypes.join(", ")}) -> ${this.returnType}`;
	}
}

export default FunctionType;
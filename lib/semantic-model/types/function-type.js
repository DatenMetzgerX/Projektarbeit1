import assert from "assert";
import {Type} from "./type";
import {ParametrizedType} from "./parametrized-type";

/**
 * function (this, params) where this is modeled as explicit parameter of the function
 */
export class FunctionType extends ParametrizedType {
	/**
	 * Creates a new function type
	 * @param {Type} thisType the type of the this object
	 * @param {Type[]} params array with the types of the parameters
	 * @param {Type} returnType type of the returned value
     * @param [id] id that identifies this function type
     */
	constructor(thisType, params, returnType, id) {
		assert(thisType === null || thisType instanceof Type, "the this type needs to be a type instance");
		assert(Array.isArray(params), "the function parameters need to be an array");
		assert(returnType instanceof Type, "the return type needs to be a type instance");

		super("Function", id);
		this.thisType = thisType;
		this.params = params;
		this.returnType = returnType;
	}

	get typeParameters() {
		return [this.thisType, this.returnType, ...this.params];
	}

	/**
	 * Returns a prettier representation of the function name that includes the this and return type and also all parameter types
	 * @returns {string} the pretty name
	 */
	get prettyName() {
		return `${this.thisType}.(${this.params.join(", ")}) -> ${this.returnType}`;
	}

	withTypeParameters(typeParameters, id) {
		const [newThis, newReturnType, ...newParams] = typeParameters;
		return new FunctionType(newThis, newParams, newReturnType, id);
	}
}

export default FunctionType;
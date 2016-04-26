import assert from "assert";
import {Type} from "./type";
import {ParametrizedType} from "./parametrized-type";

/**
 * Function (this, params): returnType where this is modeled as explicit parameter of the function
 */
export class FunctionType extends ParametrizedType {
	/**
	 * Creates a new function type
	 * @param {Type} thisType the type of the this object
	 * @param {Type[]} params array with the types of the parameters
	 * @param {Type} returnType type of the returned value
	 * @param {AstNode} [declaration=undefined] the node that declares the function. The value is not set if the type of the function is defined by an external definition
     * @param [id] id that identifies this function type
	 * @param {TypeEnvironment} [typeEnvironment] the type environment of the declaration
     */
	constructor(thisType, params, returnType, declaration, id, typeEnvironment) {
		assert(thisType === null || thisType instanceof Type, "the this type needs to be a type instance");
		assert(Array.isArray(params), "the function parameters need to be an array");
		assert(returnType instanceof Type, "the return type needs to be a type instance");

		super("Function", id);

		/**
		 * The type of this
		 * @type {Type}
         */
		this.thisType = thisType;

		/**
		 * Array that contains the types of the parameters
		 * @type {Type[]}
         */
		this.params = params;

		/**
		 * The type of the return value
		 * @type {Type}
         */
		this.returnType = returnType;

		/**
		 * The node that declares the function
		 * @type {AstNode}
         */
		this.declaration = declaration;

		/**
		 * The type environment of the declaration
		 * @type {TypeEnvironment}
         */
		this.typeEnvironment = typeEnvironment;
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
		return new FunctionType(newThis, newParams, newReturnType, this.declaration, id, this.typeEnvironment);
	}
}

export default FunctionType;
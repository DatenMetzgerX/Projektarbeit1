import assert from "assert";
import {MaybeType, NumberType, AnyType, BooleanType} from "../../semantic-model/types";

/**
 * @interface
 */
class BinaryOperator {
	/* eslint-disable no-unused-vars */
	constructor(name) {
		this.name = name;
	}

	/**
	 * Refines the type of the operator used with the given left and right parameter type
	 * @param {Type} leftType
	 * @param {Type} rightType
	 * @param {function (Type, Type): Type} unify function that can be used to unify two types.
     */
	refine(leftType, rightType, unify) {
		const leftRefined = unify(leftType, this.getLeftParameterType(leftType));
		const rightRefined = unify(this.getRightParameterType(leftType), rightType);

		return this.getOperatorReturnType(leftRefined, rightRefined);
	}

	/**
	 * Returns the required type of the left parameter
	 * @param {Type} leftType the effective type of the left expression
	 * @returns {Type} the required type of the left parameter
	 * @abstract
     */
	getLeftParameterType(leftType) {
		/* istanbul ignore next */
		assert.fail("Needs to be implemented by subclass");
	}

	/**
	 * Returns the required type for the right parameter
	 * @param {Type} rightType the effective type of the right expression
	 * @returns {Type} the required type of the right parameter
	 * @abstract
	 */
	getRightParameterType(rightType) {
		/* istanbul ignore next */
		assert.fail("Needs to be implemented by subclass");
	}

	/**
	 * Returns the return type of the operator applied to the given left and right parameter
	 * @param {Type} leftParameterType the unified type of the left parameter
	 * @param {Type} rightParameterType the unified type of the right parameter
	 * @returns {Type} the return type of the operator
     */
	getOperatorReturnType(leftParameterType, rightParameterType) {
		/* istanbul ignore next */
		assert.fail("needs to be implemented by subclass");
	}
}

class BinaryOperatorWithStaticTypes extends BinaryOperator {

	constructor (name, leftParameterType, rightParameterType, operatorReturnType) {
		super(name);
		this.leftParameterType = leftParameterType;
		this.rightParameterType = rightParameterType;
		this.operatorReturnType = operatorReturnType;
	}

	getLeftParameterType() {
		return new this.leftParameterType();
	}

	getRightParameterType() {
		return new this.rightParameterType();
	}

	getOperatorReturnType() {
		return new this.operatorReturnType();
	}
}

class NumberOperator extends BinaryOperator {
	constructor(name) {
		super(name);
	}

	getLeftParameterType() {
		return MaybeType.of(NumberType.create());
	}

	getRightParameterType() {
		return MaybeType.of(NumberType.create());
	}

	getOperatorReturnType() {
		return NumberType.create();
	}
}

class StrictEqualityOperator extends BinaryOperator {
	constructor(name) {
		super(name);
	}

	getLeftParameterType(leftType) {
		return leftType;
	}

	getRightParameterType(leftParameterType) {
		return leftParameterType;
	}

	getOperatorReturnType() {
		return new BooleanType();
	}
}

/**
 * JavaScript defines a variety of binary operations. All binary operations can be used in binary expression, whereas only
 * some operations can be used in assignment expressions. The following table lists all the binary expression and defines
 * the expected left and right parameter types with the resulting return type of the operand.
 *
 * +    (assgn) : (Maybe<T>, Maybe<T>)              -> T,       T = string | number
 * -    (assgn) : (Maybe<number>, Maybe<number>)    -> number
 * *    (assgn) : (Maybe<number>, Maybe<number>)    -> number
 * /    (assgn) : (Maybe<number>, Maybe<number>)    -> number
 * ==           : (any, any)                        -> boolean
 * !=           : (any, any)                        -> boolean
 * ===          : (T, T)                            -> boolean
 * !==          : (T, T)                            -> boolean
 * <            : (T, T)                            -> boolean, T = string | number | has valueOf() method
 * <=           : (T, T)                            -> boolean, T = string | number | has valueOf() method
 * >            : (T, T)                            -> boolean, T = string | number | has valueOf() method
 * >=           : (T, T)                            -> boolean, T = string | number | has valueOf() method
 * <<   (assgn) : (Maybe<number>, Maybe<number>)    -> number
 * >>   (assgn) : (Maybe<number>, Maybe<number>)    -> number
 * >>>  (assgn) : (Maybe<number>, Maybe<number>)    -> number
 * %    (assgn) : (Maybe<number>, Maybe<number>)    -> number
 * |    (assgn) : (Maybe<number>, Maybe<number>)    -> number
 * ^    (assgn) : (Maybe<number>, Maybe<number>)    -> number
 * &    (assgn) : (Maybe<number>, Maybe<number>)    -> number
 * in           : (string | number, Object)         -> boolean
 * instanceof   : (Object, Ctor)                    -> boolean
 *
 * Operators marked with (assgn) can also be used in assignment expressions.
 */
export const BINARY_OPERATORS = {
	"+": new NumberOperator("+"), // + for strings currently not supported
	"-": new NumberOperator("-"),
	"*": new NumberOperator("*"),
	"/": new NumberOperator("/"),
	"<": new NumberOperator("<"), // TODO support value of
	"==": new ParameterIndependentBinaryOperator("==", BooleanType.create()),
	"!=": new ParameterIndependentBinaryOperator("==", BooleanType.create()),
	"===": new StrictEqualityOperator("==="),
	"!==": new StrictEqualityOperator("!=="),
	"<<": new NumberOperator("<<"),
	">>": new NumberOperator(">>"),
	">>>": new NumberOperator(">>>"),
	"%": new NumberOperator("%"),
	"|": new NumberOperator("|"),
	"&": new NumberOperator("&"),
	"^": new NumberOperator("^")
};

export default BINARY_OPERATORS;
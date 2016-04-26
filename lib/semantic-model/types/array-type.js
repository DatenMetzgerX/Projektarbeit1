import assert from "assert";

import {RecordType} from "./record-type";
import {Type} from "./type";
import {NumberType} from "./number-type";
import {VoidType} from "./void-type";
import {MaybeType} from "./maybe-type";
import {FunctionType} from "./function-type";
import {BooleanType} from "./boolean-type";
import {StringType} from "./string-type";
import {TypeVariable} from "./type-variable";
import {SymbolFlags} from "../symbol";

const builtIns = new Set([
	"length",
	"concat", "copyWithin", "every", "fill", "filter", "find", "findIndex", "forEach", "includes",
	"indexOf", "join", "lastIndexOf", "map", "pop", "push", "reduce", "reduceRight", "reverse", "shift", "slice", "some",
	"sort", "splice", "unshift"
]);

/**
 * Array type.
 *
 * The array type is a parametrised and a record type. The array type accepts the type argument T that defines the type of
 * the array elements. If an array contains elements from different types, then the type T is any.
 */
export class ArrayType extends RecordType {

	static of(t) {
		return new ArrayType(t);
	}

	/**
	 * Creates a new array type that contains element of type of.
	 * @param {Type} of the type of the array elements
	 * @param {Immutable.Map.<Member, Type>} [properties] the additional properties of this array
	 * @param [id] the id of the instance
     */
	constructor(of, properties, id) {
		assert(of instanceof Type, "Of needs to be a type");
		super(properties, id);

		this.of = of;
	}

	get prettyName() {
		return `${this.of}[]`;
	}

	isSubType(t) {
		if (!super.isSubType(t)) {
			return false;
		}

		return this.of.isSubType(t.of);
	}

	substitute(oldType, newType) {
		if (this.same(oldType)) {
			return newType;
		}

		const substitutedOf = this.of.substitute(oldType, newType);

		if (this.of !== substitutedOf) {
			return new ArrayType(substitutedOf, this.properties, this.id);
		}

		return super.substitute(oldType, newType);
	}

	containsType(t) {
		return super.containsType(t) || this.of.containsType(t);
	}

	equals(other) {
		if (!super.equals(other)) {
			return false;
		}

		return this.of.equals(other.of);
	}

	hasProperty(symbol) {
		if ((symbol.flags & SymbolFlags.Computed) === SymbolFlags.Computed || typeof(symbol.name) === "number") {
			return true;
		}

		return builtIns.has(symbol.name) || super.hasProperty(symbol);
	}

	getType(symbol) {
		if ((symbol.flags & SymbolFlags.Computed) === SymbolFlags.Computed|| typeof(symbol.name) === "number") {
			return this.of;
		}

		if (builtIns.has(symbol.name)) {
			return this._getBuiltInType(symbol.name);
		}

		return super.getType(symbol);
	}

	_getBuiltInType(name) {
		const maybeArray = MaybeType.of(this);
		const callbackThis = new TypeVariable();
		const callbackThisArg = MaybeType.of(callbackThis);
		const predicateT= new FunctionType(callbackThis, [this.of, MaybeType.of(NumberType.create()), maybeArray], BooleanType.create());

		switch (name) {
		case "length":
			return NumberType.create();
		case "concat":
			return new FunctionType(this, [this, maybeArray, maybeArray], this);
		case "copyWithin":
			return new FunctionType(this, [NumberType.create(), NumberType.create(), MaybeType.of(NumberType.create())], VoidType.create());
		case "every":
		case "some":
			return new FunctionType(this, [predicateT, callbackThisArg], BooleanType.create());
		case "filter":
			return new FunctionType(this, [predicateT, callbackThisArg], this);
		case "fill":
			return new FunctionType(this, [this.of, MaybeType.of(NumberType.create()), MaybeType.of(NumberType.create())], VoidType.create());
		case "find":
			return new FunctionType(this, [predicateT, callbackThisArg], this.of);
		case "findIndex":
			return new FunctionType(this, [predicateT, callbackThisArg], NumberType.create());
		case "forEach":
			return new FunctionType(this, [new FunctionType(callbackThis, [this.of, MaybeType.of(NumberType.create()), this], VoidType.create()), callbackThisArg], VoidType.create());
		case "includes":
			return new FunctionType(this, [this.of, MaybeType.of(NumberType.create())], BooleanType.create());
		case "lastIndexOf":
		case "indexOf":
			return new FunctionType(this, [this.of, MaybeType.of(NumberType.create())], NumberType.create());
		case "map":
			var mapReturnType = new TypeVariable();
			return new FunctionType(this, [new FunctionType(callbackThis, [this.of, MaybeType.of(NumberType.create()), maybeArray], mapReturnType), callbackThisArg], ArrayType.of(mapReturnType));
		case "join":
			return new FunctionType(this, [MaybeType.of(StringType.create())], StringType.create());
		case "pop":
		case "shift":
			return new FunctionType(this, [], this.of);
		case "push":
		case "unshift":
			return new FunctionType(this, [this.of], NumberType.create());
		case "reduce":
		case "reduceRight":
			var reduceValue = new TypeVariable();
			return new FunctionType(this, [new FunctionType(VoidType.create(), [reduceValue, this.of, MaybeType.of(NumberType.create()), maybeArray], reduceValue), MaybeType.of(reduceValue)], reduceValue);
		case "reverse":
			return new FunctionType(this, [], this);
		case "slice":
			return new FunctionType(this, [NumberType.create(), MaybeType.of(NumberType.create())], this);
		case "sort":
			return new FunctionType(this, [MaybeType.of(new FunctionType(VoidType.create(), [this.of, this.of], NumberType.create()))], this);
		default:
			assert.fail(`${name} is not a built in array function`);
		}
	}

	setType(symbol, type) {
		assert(!builtIns.has(symbol.name), `The type of the built in array property '${symbol.name}' cannot be changed`);

		if ((symbol.flags & SymbolFlags.Computed) === SymbolFlags.Computed|| typeof(symbol.name) === "number") {
			return new ArrayType(type, this.properties, this.id);
		}

		return super.setType(symbol, type);
	}

	withProperties(properties, id) {
		return new ArrayType(this.of, properties, id);
	}
}

export default ArrayType;
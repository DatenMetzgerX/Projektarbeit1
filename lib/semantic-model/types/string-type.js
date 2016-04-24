import Immutable from "immutable";
import assert from "assert";

import {RecordType} from "./record-type";
import {NumberType} from "./number-type";
import {FunctionType} from "./function-type";
import {MaybeType} from "./maybe-type";
import {BooleanType} from "./boolean-type";

let builtIns;

/**
 * string type
 */
export class StringType extends RecordType {

	static create() {
		return new StringType();
	}

	get prettyName() {
		return "string";
	}

	hasProperty(symbol) {
		return super.hasProperty(symbol) || builtIns.has(symbol.name);
	}

	getType(symbol) {
		const builtIn = builtIns.get(symbol.name);
		return builtIn || super.getType(symbol);
	}

	setType(symbol, type) {
		if (builtIns.has(symbol.name)) {
			assert.fail(`Cannot modify the type of the built in operation string.${symbol.name}`);
		}
		super.setType(symbol, type);
	}
}

const instance = new StringType();

builtIns = new Immutable.Map([
	["length", NumberType.create()],
	["charAt", new FunctionType(instance, [NumberType.create()], instance)],
	["charCodeAt", new FunctionType(instance, [NumberType.create()], NumberType.create())],
	["codePointAt", new FunctionType(instance, [NumberType.create()], NumberType.create())],
	// TODO concat requires varargs
	// ["concat", new FunctionType(stringT, [numberT], numberT)]
	["endsWith", new FunctionType(instance, [instance, MaybeType.of(NumberType.create())], BooleanType.create())],
	["includes", new FunctionType(instance, [instance, MaybeType.of(NumberType.create())], BooleanType.create())],
	["indexOf", new FunctionType(instance, [instance, MaybeType.of(NumberType.create())], NumberType.create())],
	["lastIndexOf", new FunctionType(instance, [instance, MaybeType.of(NumberType.create())], NumberType.create())],
	// TODO match requires regex
	["normalize", new FunctionType(instance, [MaybeType.of(instance)], instance)], // TODO from is an enum
	["repeat", new FunctionType(instance, [NumberType.create()], instance)],
	["replace", new FunctionType(instance, [instance, instance], NumberType.create())], // TODO old can be regex or string, new can be string or function, requires union
	// TODO search requires regex
	["slice", new FunctionType(instance, [NumberType.create(), MaybeType.of(NumberType.create())], instance)],
	// TODO split requires arrays
	["startsWith", new FunctionType(instance, [instance, MaybeType.of(NumberType.create())], BooleanType.create())],
	["substr", new FunctionType(instance, [instance, MaybeType.of(NumberType.create())], instance)],
	["substring", new FunctionType(instance, [NumberType.create(), MaybeType.of(NumberType.create())], instance)],
	["toLocaleLowerCase", new FunctionType(instance, [], instance)],
	["toLocaleUpperCase", new FunctionType(instance, [], instance)],
	["toLowerCase", new FunctionType(instance, [], instance)],
	["toString", new FunctionType(instance, [], instance)],
	["toUpperCase", new FunctionType(instance, [], instance)],
	["trim", new FunctionType(instance, [], instance)],
	["valueOf", new FunctionType(instance, [], instance)]
	// TODO string.raw
]);

export default StringType;
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

const numberT = new NumberType();
const boolT = new BooleanType();
const stringT = new StringType();

builtIns = new Immutable.Map([
	["length", numberT],
	["charAt", new FunctionType(stringT, [numberT], stringT)],
	["charCodeAt", new FunctionType(stringT, [numberT], numberT)],
	["codePointAt", new FunctionType(stringT, [numberT], numberT)],
	// TODO concat requires varargs
	// ["concat", new FunctionType(stringT, [numberT], numberT)]
	["endsWith", new FunctionType(stringT, [stringT, new MaybeType(numberT)], boolT)],
	["includes", new FunctionType(stringT, [stringT, new MaybeType(numberT)], boolT)],
	["indexOf", new FunctionType(stringT, [stringT, new MaybeType(numberT)], numberT)],
	["lastIndexOf", new FunctionType(stringT, [stringT, new MaybeType(numberT)], numberT)],
	// TODO match requires regex
	["normalize", new FunctionType(stringT, [new MaybeType(stringT)], stringT)], // TODO from is an enum
	["repeat", new FunctionType(stringT, [numberT], stringT)],
	["replace", new FunctionType(stringT, [stringT, stringT], numberT)], // TODO old can be regex or string, new can be string or function, requires union
	// TODO search requires regex
	["slice", new FunctionType(stringT, [numberT, new MaybeType(numberT)], stringT)],
	// TODO split requires arrays
	["startsWith", new FunctionType(stringT, [stringT, new MaybeType(numberT)], boolT)],
	["substr", new FunctionType(stringT, [stringT, new MaybeType(numberT)], stringT)],
	["substring", new FunctionType(stringT, [numberT, new MaybeType(numberT)], stringT)],
	["toLocaleLowerCase", new FunctionType(stringT, [], stringT)],
	["toLocaleUpperCase", new FunctionType(stringT, [], stringT)],
	["toLowerCase", new FunctionType(stringT, [], stringT)],
	["toString", new FunctionType(stringT, [], stringT)],
	["toUpperCase", new FunctionType(stringT, [], stringT)],
	["trim", new FunctionType(stringT, [], stringT)],
	["valueOf", new FunctionType(stringT, [], stringT)]
	// TODO string.raw
]);

export default StringType;
import assert from "assert";
import {SymbolFlags, Symbol} from "./symbol";
import {ObjectType, FunctionType, AnyType, VoidType} from "./types";

/**
 * Adds the built in variables like console to the passed in scope.
 *
 * @param {Scope} scope the scope to which the operations should be added
 */
export function addBuiltInVariables(scope) {
	scope.addSymbol(new Symbol("console", SymbolFlags.Variable));
}

/**
 * Adds the types of the built in variables to the type environment
 * @param {Scope} scope the global scope that contains the built in variables
 * @param {TypeEnvironment} typeEnvironment the type environment to which the types should be added
 * @returns {TypeEnvironment} type environment that contains the types for the built in operations
 */
export function addsTypesOfBuiltInVariables(scope, typeEnvironment) {
	const console = getSymbolOrThrow(scope, "console");
	const consoleType = ObjectType.create([
		[new Symbol("log", SymbolFlags.Function | SymbolFlags.Property), new FunctionType(AnyType.create(), [AnyType.create(), AnyType.create()], VoidType.create())]
	]);

	return typeEnvironment.setType(console, consoleType);
}

function getSymbolOrThrow(scope, name) {
	const symbol = scope.getOwnSymbol(name);

	assert(symbol, "The symbol '${name}' does not exist in the given scope.");
	return symbol;
}
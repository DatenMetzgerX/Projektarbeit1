import assert from "assert";
import {SymbolFlags, Symbol} from "./symbol";
import {ObjectType, FunctionType, AnyType, VoidType, StringType, MaybeType, BooleanType} from "./types";

/**
 * Adds the built in variables like console to the passed in scope.
 *
 * @param {Scope} scope the scope to which the operations should be added
 */
export function addBuiltInVariables(scope) {
	scope.addSymbol(new Symbol("console", SymbolFlags.Variable));
	scope.addSymbol(new Symbol("document", SymbolFlags.Variable));
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


	const evt = ObjectType.create([
		[new Symbol("bubbles", SymbolFlags.Property), BooleanType.create()],
		[new Symbol("cancelable", SymbolFlags.Property), BooleanType.create()],
		[new Symbol("defaultPrevented", SymbolFlags.Property), BooleanType.create()],
		[new Symbol("type", SymbolFlags.Property), StringType.create()],
		[new Symbol("preventDefault", SymbolFlags.Property | SymbolFlags.Function), new FunctionType(AnyType.create(), [], VoidType.create())],
		[new Symbol("stopImmediatePropagation", SymbolFlags.Property | SymbolFlags.Function), new FunctionType(AnyType.create(), [], VoidType.create())],
		[new Symbol("stopPropagation", SymbolFlags.Property | SymbolFlags.Function), new FunctionType(AnyType.create(), [], VoidType.create())]
	]);
	const eventListener = new FunctionType(AnyType.create(), [evt], AnyType.create());
	const elementType = ObjectType.create([
		[new Symbol("addEventListener", SymbolFlags.Function | SymbolFlags.Property), new FunctionType(AnyType.create(), [StringType.create(), eventListener, AnyType.create(), AnyType.create()], VoidType.create())]
	]);

	const document = getSymbolOrThrow(scope, "document");
	const documentType = ObjectType.create([
		[new Symbol("getElementById", SymbolFlags.Function | SymbolFlags.Property), new FunctionType(AnyType.create(), [StringType.create()], MaybeType.of(elementType))]
	]);

	return typeEnvironment
		.setType(console, consoleType)
		.setType(document, documentType);
}

function getSymbolOrThrow(scope, name) {
	const symbol = scope.getOwnSymbol(name);

	assert(symbol, "The symbol '${name}' does not exist in the given scope.");
	return symbol;
}
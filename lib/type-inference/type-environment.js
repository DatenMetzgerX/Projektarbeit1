import Immutable from "immutable";
import assert from "assert";

/**
 * Representation of a type environement. Maps symbols to theire
 * concrete base type or to a type variable.
 * The structure is implemented as an immutable. Changes to the structures return a new object that reflects the change.
 *
 * @immutable
 */
export class TypeEnvironment {

	/**
	 * Creates a new instance
	 * @param {Immutable.Map} [env=Immutable.Map()] the table that maps the symbols to the types, by default the environment
	 * is initialized with a default mapping.
     */
	constructor(env= new Immutable.Map()) {
		this._mappings = env;
	}

	/**
	 * Indicator if the type environment contains any mappings or not
	 * @returns {boolean} true if the type environment contains no mappings at all.
     */
	get isEmpty() {
		return this._mappings.size === 0;
	}

	/**
	 * Assigns the given symbol the given type
	 * @param {Symbol} symbol the symbol that should be associated with the given type
	 * @param {Type} type the type to associated with the symbol
	 * @returns {TypeEnvironment} the new type environment that includes the mapping from the passed in symbol to the given type.
     */
	setType(symbol, type) {
		assert(symbol, "A symbol needs to be specified");
		assert(type, "A type needs to be specified");

		return new TypeEnvironment(this._mappings.set(symbol, type));
	}

	/**
	 * Returns a boolean indicating whether the type environment contains a mapping from the symbol to a type.
	 * @param {Symbol} symbol They symbol to test for precense in the type environment
	 * @returns {boolean} true if a mapping from the given symbol to a type exists
     */
	hasType(symbol) {
		return this._mappings.has(symbol);
	}

	/**
	 * Returns the associrated type for the given symbol
	 * @param {Symbol} symbol the symbol for which the lookup should be performed
	 * @returns {Type} the resolved type for this symbol or undefined if this type environment does not contain a mapping
	 * for the given symbol.
     */
	getType(symbol) {
		assert(symbol, "symbol cannot be undefined or null");
		return this._mappings.get(symbol);
	}

	/**
	 * Prints the type environment to the output stream
	 * @param {WriteStream} stream the target stream
	 */
	dump(stream) {
		this._mappings.forEach((type, symbol) => {
			stream.write(`${symbol.name} -> ${type.resolved}\n`);
		});
	}

	/**
	 * Assigns the resolved types to their corresponding symbols.
	 */
	assignTypeToSymbols() {
		this._mappings.forEach((type, symbol) => {
			symbol.type = type.resolveDeep();
		});
	}
}

export default TypeEnvironment;
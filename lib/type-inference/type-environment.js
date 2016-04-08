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
		this.mappings = env;
	}

	/**
	 * Indicator if the type environment contains any mappings or not
	 * @returns {boolean} true if the type environment contains no mappings at all.
     */
	get isEmpty() {
		return this.mappings.size === 0;
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

		return new TypeEnvironment(this.mappings.set(symbol, type));
	}

	/**
	 * Replaces the type associated with the given symbol in the type environment (and all it's usages in parametrized types).
	 * @param {Symbol} symbol the symbol for which the type should be replaced
	 * @param {function (oldType: Type): Type} callback callback that is invoked with the old type and returns the new type
	 * for the given symbol
	 */
	replaceType(symbol, callback) {
		const oldType = this.mappings.get(symbol);
		assert(oldType, `No existing mapping for ${symbol} exists.`);

		const newType = callback(oldType);

		return this.substitute(oldType, newType);
	}

	/**
	 * Returns the associrated type for the given symbol
	 * @param {Symbol} symbol the symbol for which the lookup should be performed
	 * @returns {Type} the resolved type for this symbol or undefined if this type environment does not contain a mapping
	 * for the given symbol.
     */
	getType(symbol) {
		assert(symbol, "symbol cannot be undefined or null");
		return this.mappings.get(symbol);
	}

	/**
	 * Returns a boolean indicating whether the type environment contains a mapping from the symbol to a type.
	 * @param {Symbol} symbol They symbol to test for precense in the type environment
	 * @returns {boolean} true if a mapping from the given symbol to a type exists
     */
	hasType(symbol) {
		return this.mappings.has(symbol);
	}

	/**
	 * Substitutes all occurrences of the given old type with the new type.
	 * @param {Type} oldType the old type
	 * @param {Type} newType the new type
	 * @returns {TypeEnvironment} the new type environment where the old type is substituted with the new type
     */
	substitute(oldType, newType) {
		if (oldType.same(newType)) {
			return this;
		}

		const substitutedTypeEnvironment = this.mappings.withMutations(map => this._substituteInMutable(map, oldType, newType));
		return new TypeEnvironment(substitutedTypeEnvironment);
	}

	_substituteInMutable(mutable, oldType, newType) {
		const substitutions = [{oldType, newType }];
		let currentSubstitution;

		while ((currentSubstitution = substitutions.pop())) {
			for (const [symbol, type] of mutable) {
				const substituted = type.substitute(currentSubstitution.oldType, currentSubstitution.newType);
				if (substituted !== type) {
					mutable.set(symbol, substituted);

					// the current type has changed, we need to substitute this one too. But only do so if it is not the old type.
					if (type !== currentSubstitution.oldType) {
						substitutions.push({oldType: type, newType: substituted });
					}
				}
			}
		}
	}

	/**
	 * Returns a new type environment that only contains the changed or new mappings since the previous one
	 * @param {TypeEnvironment} before
     */
	difference(before) {
		const diff = this.mappings.withMutations(map => {
			for (const [symbol, type] of map) {
				const typeBefore = before.getType(symbol);
				if (typeBefore && typeBefore.same(type)) {
					map.delete(symbol);
				}
			}
		});

		if (this.mappings.equals(diff)) {
			return this;
		}

		return new TypeEnvironment(diff);
	}

	/**
	 * Prints the type environment to the output stream
	 * @param {WriteStream} stream the target stream
	 */
	dump(stream) {
		this.mappings.forEach((type, symbol) => {
			stream.write(`${symbol.name} -> ${type}\n`);
		});
	}
}

/**
 * The empty type environment
 * @type {TypeEnvironment}
 */
TypeEnvironment.EMPTY = new TypeEnvironment();

export default TypeEnvironment;
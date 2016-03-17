import assert from "assert";

export class Scope {

	/**
	 * Creates a new scope with the given parent scope.
	 * @param parent {Scope?} the parent scope
     */
	constructor(parent) {
		this.parent = parent;
		this._symbols = new Map();
	}

	addSymbol(symbol) {
		assert(symbol, "symbol cannot be undefined");
		assert(!this._symbols.has(symbol.name), `Another symbol with the name ${symbol.name} already exists`);

		this._symbols.set(symbol.name, symbol);
	}

	get symbols() {
		return this._symbols.values();
	}

	resolveSymbol(name) {
		const symbol = this._symbols.get(name);
		if (!symbol && this.parent) {
			return this.parent.resolveSymbol(name);
		}

		return symbol;
	}
}

export default Scope;


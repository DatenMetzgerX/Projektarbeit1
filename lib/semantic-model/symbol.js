import assert from "assert";

export class Symbol {
	/**
	 * Creates a new symbol with the given name
	 * @param name the name of the symbol
     */
	constructor(name, flags) {
		/**
		 * The name of the symbol, needs to be unique in a scope
		 * @type string
		 */
		this.name = name;

		/**
		 * The flags that identify the type of the symbol
		 */
		this.flags = flags;

		/**
		 * The members of this symbol. If the symbol represents a variable, then the members contains the symbols of all members,
		 * e.g. for the following code `x.y`, the symbol for x has a member with the name 'y'.
		 * @type {Map.<string, Symbol>}
         */
		this.members = new Map();

		/**
		 * Stores the node where the symbol has been declared. Symbols without declarations are symbols that have been
		 * accessed in the code but have never been declared or initialized (assignment).
         */
		this.declaration = null;

		/**
		 * Stores the first node where a value has been assigned to the symbol.
		 * @type {Node}
         */
		this.valueDeclaration = null;
	}

	addMember(symbol) {
		assert(symbol);
		assert(!symbol.members.has(symbol.name), `A member with the name ${symbol.name} already exists for the symbol ${this.name}.`);

		this.members.set(symbol.name, symbol);
	}

	getMember(name) {
		return this.members.get(name);
	}

	toJSON() {
		return this.name;
	}
}

export const SymbolFlags = {
	None: 0,
	FunctionScopedVariable: 0x00000001,  // Variable (var) or parameter
	BlockScopedVariable:    0x00000002,  // A block-scoped variable (let or const)
	Property:               0x00000004,  // Property or enum member
	EnumMember:             0x00000008,  // Enum member
	Function:               0x00000010  // Function
};

SymbolFlags.Variable = 	SymbolFlags.FunctionScopedVariable | SymbolFlags.BlockScopedVariable;

export default Symbol;
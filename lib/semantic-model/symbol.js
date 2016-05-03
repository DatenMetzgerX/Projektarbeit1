import assert from "assert";

export class Symbol {
	/**
	 * Creates a new symbol with the given name
	 * @param name the name of the symbol
     */
	constructor(name, flags) {
		/**
		 * The name of the symbol, needs to be unique in a scope
		 * @type {string}
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
		 * @type {AstNode}
         */
		this.declaration = null;

		/**
		 * Stores the first node where a value has been assigned to the symbol.
		 * @type {AstNode}
         */
		this.valueDeclaration = null;

		/**
		 * Array with nodes referencing this symbol
		 * @type {Set<AstNode>}
         */
		this.references = new Set();
	}

	/**
	 * Adds a member to this symbol
	 * @param {Symbol} symbol the symbol of the member
     */
	addMember(symbol) {
		assert(symbol);
		assert(!this.hasMember(symbol), `A member with the name ${symbol.name} already exists for the symbol ${this.name}.`);

		this.members.set(symbol.name, symbol);
	}

	/**
	 * Returns the member with the given name or undefined
	 * @param {string|Symbol} name the name of the member
	 * @returns {Symbol} the member with the given name or undefined
     */
	getMember(name) {
		name = name instanceof Symbol ? name.name : name;
		return this.members.get(name);
	}

	/**
	 * Returns true if this symbol has a member with the given name
	 * @param {string|Symbol} name the name of the member
	 * @returns {boolean} true if the symbol has a member with the given name
     */
	hasMember(name) {
		name = name instanceof Symbol ? name.name : name;
		return this.members.has(name);
	}

	/**
	 * Returns a string representation of the symbol
	 * @returns {string} the string representation
     */
	toString() {
		return this.name;
	}

	reference(node) {
		this.references.add(node);
	}
}


export const SymbolFlags = {
	None: 0,
	FunctionScopedVariable: 0x00000001,  // Variable (var) or parameter
	BlockScopedVariable:    0x00000002,  // A block-scoped variable (let or const)
	Property:               0x00000004,  // Property or enum member
	EnumMember:             0x00000008,  // Enum member
	Function:               0x00000010,  // Function,
	Return:                 0x00000020, // Return statements,
	Computed:               0x00000030,
	Anonymous:              0x00000040,
	Hoisted:                0x00000050,
	UNKNOWN:                0xffffffff
};

SymbolFlags.Variable = 	SymbolFlags.FunctionScopedVariable | SymbolFlags.BlockScopedVariable;

/**
 * Symbol for the return value of a function.
 * @type {Symbol}
 */
Symbol.RETURN = new Symbol("return", SymbolFlags.Return);

/**
 * Symbol for computed members
 * @type {Symbol}
 */
Symbol.COMPUTED = new Symbol("___________________________COMPUTED___________________________", SymbolFlags.Property | SymbolFlags.Computed | SymbolFlags.Anonymous);

export default Symbol;

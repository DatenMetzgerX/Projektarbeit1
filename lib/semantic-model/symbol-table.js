import assert from "assert";
import Symbol from "./symbol";

/**
 * Symbol table that stores the symbol for an ast node and can resolve the symbol for an ast node.
 */
export class SymbolTable {
	/**
	 * Sets the symbol for the given node
	 * @param {AstNode} node the node for which the symbol should be set
	 * @param {Symbol} symbol the symbol that should be associated with the node
     */
	setSymbol(node, symbol) {
		assert("Node cannot be null or undefined");
		assert.ok(symbol instanceof Symbol, "the symbol needs to be an instance of symbol");
		node._symbol = symbol;
	}

	/**
	 * Returns the associated symbol of the node or {undefined}
	 * @param {AstNode} node the node for which the symbol should be retrieved
	 * @returns {Symbol} the symbol of the node or undefined
     */
	getSymbol(node) {
		return node._symbol;
	}
}

export default SymbolTable;
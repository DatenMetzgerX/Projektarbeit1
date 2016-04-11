import {expect} from "chai";

import Symbol from "../../lib/semantic-model/symbol";
import SymbolTable from "../../lib/semantic-model/symbol-table";

describe("SymbolTable", function () {
	let table;

	beforeEach(function () {
		table = new SymbolTable();
	});
	it("returns the associated symbol of the passed in node", function () {
		// arrange
		const astNode = {};
		const symbol = new Symbol("");

		table.setSymbol(astNode, symbol);

		// act
		expect(table.getSymbol(astNode)).to.equal(symbol);
	});

	describe("getSymbol", function () {
		it("throws if the node is null or undefined", function () {
			expect(() => table.getSymbol(undefined)).to.throw;
			expect(() => table.getSymbol(null)).to.throw;
		});
	});

	describe("setSymbol", function () {
		it("throws if the node is null or undefined", function () {
			const symbol = new Symbol("");

			expect(() => table.getSymbol(undefined, symbol)).to.throw;
			expect(() => table.getSymbol(null, symbol)).to.throw;
		});

		it("throws if the symbol is null or undefined", function () {
			const astNode = {};

			expect(() => table.getSymbol(astNode, undefined)).to.throw;
			expect(() => table.getSymbol(astNode, null)).to.throw;
		});
	});

});
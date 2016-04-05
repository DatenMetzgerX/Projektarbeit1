import {expect} from "chai";

import Symbol, {SymbolFlags} from "../../lib/semantic-model/symbol";
import {NumberType} from "../../lib/semantic-model/types/number-type";

describe("Symbol", function () {
	it("has no members by default", function () {
		// arrange
		const symbol = new Symbol("x", SymbolFlags.BlockScopedVariable | SymbolFlags.Variable);

		// assert
		expect(Array.from(symbol.members.values())).to.be.empty;
	});

	it("initializes the declaration and value declaration to null by default", function () {
		// arrange
		const symbol = new Symbol("x", SymbolFlags.BlockScopedVariable | SymbolFlags.Variable);

		// assert
		expect(symbol).to.have.property("declaration").that.is.null;
		expect(symbol).to.have.property("valueDeclaration").that.is.null;
	});

	it("sets the name and flags to the constructor arguments", function () {
		// arrange
		const symbol = new Symbol("x", SymbolFlags.BlockScopedVariable | SymbolFlags.Variable);

		// assert
		expect(symbol).to.have.property("name").that.equals("x");
		expect(symbol).to.have.property("flags").that.equals(SymbolFlags.BlockScopedVariable | SymbolFlags.Variable);
	});

	describe("addMember", function () {
		it("adds the given member tot he symbol's members", function () {
			// arrange
			const symbol = new Symbol("person", SymbolFlags.BlockScopedVariable | SymbolFlags.Variable);
			const memberSymbol = new Symbol("name", SymbolFlags.Property);

			// act
			symbol.addMember(memberSymbol);

			// assert
			expect(symbol.getMember("name")).to.equal(memberSymbol);
		});

		it("throws if the symbol already has a member with the given name", function () {
			// arrange
			const symbol = new Symbol("person", SymbolFlags.BlockScopedVariable | SymbolFlags.Variable);
			const memberSymbol = new Symbol("name", SymbolFlags.Property);
			symbol.addMember(memberSymbol);

			// act
			expect(() => symbol.addMember(memberSymbol)).to.throw;
		});

		it("throws if the symbol is absent", function () {
			// arrange
			const symbol = new Symbol("person", SymbolFlags.BlockScopedVariable | SymbolFlags.Variable);

			// act
			expect(() => symbol.addMember()).to.throw;
		});
	});

	describe("hasMember", function () {
		it("returns false if the symbol has no member with the given name", function () {
			// arrange
			const symbol = new Symbol("person", SymbolFlags.BlockScopedVariable | SymbolFlags.Variable);
			const memberSymbol = new Symbol("name", SymbolFlags.Property);
			symbol.addMember(memberSymbol);

			// act, assert
			expect(symbol.hasMember("age")).to.be.false;
		});

		it("returns true if the symbol has a member with the given name", function () {
			// arrange
			const symbol = new Symbol("person", SymbolFlags.BlockScopedVariable | SymbolFlags.Variable);
			const memberSymbol = new Symbol("name", SymbolFlags.Property);
			symbol.addMember(memberSymbol);

			// act, assert
			expect(symbol.hasMember("name")).to.be.true;
		});
	});

	describe("toString", function () {
		it("returns the name of the symbol", function () {
			// arrange
			const symbol = new Symbol("x", SymbolFlags.BlockScopedVariable);
			symbol.type = new NumberType();

			// act, assert
			expect(symbol.toString()).to.equal("x");
		});
	});
});

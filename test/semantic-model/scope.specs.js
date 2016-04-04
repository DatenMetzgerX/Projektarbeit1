import {expect} from "chai";
import Scope from "../../lib/semantic-model/scope";
import Symbol, {SymbolFlags} from "../../lib/semantic-model/symbol";

describe("Scope", function () {
	it("is empty by default", function () {
		// act
		const scope = new Scope(null);

		// assert
		expect(Array.from(scope.symbols)).to.be.empty;
	});

	describe("addSymbol", function () {
		it("adds the given symbol", function () {
			// arrange
			const scope = new Scope(null);
			const symbol = new Symbol("x", SymbolFlags.BlockScopedVariable);

			// act
			scope.addSymbol(symbol);

			// assert
			expect(Array.from(scope.symbols)).to.contain(symbol);
		});

		it("throws when the given symbol already exists in the given scope", function () {
			// arrange
			const scope = new Scope(null);
			const symbol = new Symbol("x", SymbolFlags.BlockScopedVariable);
			scope.addSymbol(symbol);

			// act, assert
			expect(() => scope.addSymbol(new Symbol("x", SymbolFlags.FunctionScopedVariable))).to.throw;
		});

		it("does not throw if a symbol shadows a symbol from a parent scope", function () {
			// arrange
			const scope = new Scope(null);
			const symbol = new Symbol("x", SymbolFlags.BlockScopedVariable);
			scope.addSymbol(symbol);

			const childScope = scope.createChild();

			// act, assert
			expect(() => childScope.addSymbol(new Symbol("x", SymbolFlags.FunctionScopedVariable))).not.to.throw;
		});
	});

	describe("hasOwnSymbol", function () {
		it("returns false if the scope does not contain a symbol with the given name", function () {
			const scope = new Scope(null);

			// act, assert
			expect(scope.hasOwnSymbol("x")).to.be.false;
		});

		it("returns true if the scope contains a symbol with the given name", function () {
			const scope = new Scope(null);
			const symbol = new Symbol("x", SymbolFlags.BlockScopedVariable);
			scope.addSymbol(symbol);

			// act, assert
			expect(scope.hasOwnSymbol("x")).to.be.true;
		});

		it("returns false if only the parent scope contains a symbol with the given name", function () {
			const scope = new Scope(null);
			const symbol = new Symbol("x", SymbolFlags.BlockScopedVariable);
			scope.addSymbol(symbol);

			const childScope = scope.createChild();

			// act, assert
			expect(childScope.hasOwnSymbol("x")).to.be.false;
		});
	});

	describe("hasSymbol", function () {
		it("returns false if the scope does not contain a symbol with the given name", function () {
			const scope = new Scope(null);

			// act, assert
			expect(scope.hasSymbol("x")).to.be.false;
		});

		it("returns true if the scope contains a symbol with the given name", function () {
			const scope = new Scope(null);
			const symbol = new Symbol("x", SymbolFlags.BlockScopedVariable);
			scope.addSymbol(symbol);

			// act, assert
			expect(scope.hasSymbol("x")).to.be.true;
		});

		it("returns true if the parent scope contains a symbol with the given name", function () {
			const scope = new Scope(null);
			const symbol = new Symbol("x", SymbolFlags.BlockScopedVariable);
			scope.addSymbol(symbol);

			const childScope = scope.createChild();

			// act, assert
			expect(childScope.hasSymbol("x")).to.be.true;
		});
	});

	describe("symbols", function () {
		it("returns only the symbols defined in this scope", function () {
			// arrange
			const scope = new Scope(null);
			const symbol = new Symbol("x", SymbolFlags.BlockScopedVariable);
			scope.addSymbol(symbol);

			const childScope = scope.createChild();
			const ySymbol = new Symbol("y", SymbolFlags.FunctionScopedVariable);
			childScope.addSymbol(ySymbol);

			// assert
			expect(Array.from(childScope.symbols)).to.deep.equal([ySymbol]);
		});
	});

	describe("getAllSymbols", function () {
		it("returns the symbols in this and from the parent scopes", function () {
			// arrange
			const scope = new Scope(null);
			const xSymbol = new Symbol("x", SymbolFlags.BlockScopedVariable);
			scope.addSymbol(xSymbol);

			const childScope = scope.createChild();
			const ySymbol = new Symbol("y", SymbolFlags.FunctionScopedVariable);
			childScope.addSymbol(ySymbol);

			// assert
			expect(Array.from(childScope.getAllSymbols())).to.deep.equal([ySymbol, xSymbol]);
		});
	});

	describe("isGlobal", function () {
		it("returns true if the scope has no parent scope", function () {
			// arrange
			const scope = new Scope();

			// assert
			expect(scope.isGlobal).to.be.true;
		});

		it("is false if the scope has a parent scope", function () {
			// arrange
			const globalScope = new Scope();
			const childScope = globalScope.createChild();

			// assert
			expect(childScope.isGlobal).to.be.false;
		});
	});

	describe("resolveSymbol", function () {
		it("resolves the symbol with the given name", function () {
			// arrange
			const scope = new Scope(null);
			const symbol = new Symbol("x", SymbolFlags.BlockScopedVariable);
			scope.addSymbol(symbol);

			// act, assert
			expect(scope.resolveSymbol("x")).to.equal(symbol);
		});

		it("resolves symbols defined in the parent scope", function () {
			// arrange
			const scope = new Scope(null);
			const symbol = new Symbol("x", SymbolFlags.BlockScopedVariable);
			scope.addSymbol(symbol);

			const childScope = scope.createChild();

			// act, assert
			expect(childScope.resolveSymbol("x")).to.equal(symbol);
		});

		it("resolves the symbol from the nearest scope if the symbol shadows a symbol from a parent scope", function () {
			// arrange
			const scope = new Scope(null);
			const shadowedSymbol = new Symbol("x", SymbolFlags.BlockScopedVariable);
			scope.addSymbol(shadowedSymbol);

			const childScope = scope.createChild();
			const shadowingSymbol = new Symbol("x", SymbolFlags.FunctionScopedVariable);

			childScope.addSymbol(shadowingSymbol);

			// act, assert
			expect (childScope.resolveSymbol("x")).to.equal(shadowingSymbol);
		});
	});

	describe("createChild", function () {
		it("returns a new scope", function () {
			// arrange
			const globalScope = new Scope();

			// act
			const child = globalScope.createChild();

			// assert
			expect(child).not.to.be.null.and.not.to.equal(globalScope);
		});

		it("sets the parent scope to the scope on which the function has been invoked", function () {
			// arrange
			const globalScope = new Scope();

			// act
			const child = globalScope.createChild();

			// assert
			expect(child).with.property("parent").that.equals(globalScope);
		});
	});
});
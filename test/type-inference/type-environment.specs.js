import {expect} from "chai";
import Symbol, {SymbolFlags} from "../../lib/semantic-model/symbol";
import {Type} from "../../lib/semantic-model/types/index";
import TypeEnvironment from "../../lib/type-inference/type-environment";

describe("TypeEnvironment", function () {
	let environment;

	beforeEach(function () {
		environment = new TypeEnvironment();
	});

	it("creates an empty type environment by default", function () {
		// assert
		expect(environment.isEmpty).to.be.true;
	});

	describe("setType", function () {

		it("returns a new type environment containing the new mapping for the passed in symbol to the given type", function () {
			// arrange
			const symbol = new Symbol("a", SymbolFlags.BlockScopedVariable);
			const type = new Type("number");

			// act
			let newEnvironment = environment.setType(symbol, type);

			// assert
			expect(newEnvironment).not.to.equal(environment);
			expect(newEnvironment.isEmpty).to.be.false;
			expect(newEnvironment.hasType(symbol)).to.be.true;
		});

		it("does not add the type mapping to the existing type environment (it is immutable)", function () {
			// arrange
			const symbol = new Symbol("a", SymbolFlags.BlockScopedVariable);
			const type = new Type("number");

			// act
			environment.setType(symbol, type);

			// assert
			expect(environment.hasType(symbol)).to.be.false;
		});

		it("throws if the symbol is absent", function () {
			// arrange
			const type = new Type("number");

			// act, assert
			expect(() => environment.setType(null, type)).to.throw("A symbol needs to be specified");
		});

		it("throws if the type is absent", function () {
			// arrange
			const symbol = new Symbol("a", SymbolFlags.BlockScopedVariable);

			// act, assert
			expect(() => environment.setType(symbol, null)).to.throw("A type needs to be specified");
		});
	});

	describe("getType", function () {
		it("returns the type for a given symbol if the environment contains a mapping for the passed in symbol", function () {
			// arrange
			const symbol = new Symbol("a", SymbolFlags.BlockScopedVariable);
			const type = new Type("number");

			environment = environment.setType(symbol, type);

			// act, assert
			expect(environment.getType(symbol)).to.equal(type);
		});

		it("returns undefined if the type environment does not contain a mapping for the given symbol", function () {
			// arrange
			const symbol = new Symbol("a", SymbolFlags.BlockScopedVariable);

			// act, assert
			expect(environment.getType(symbol)).to.be.undefined;
		});
	});
});
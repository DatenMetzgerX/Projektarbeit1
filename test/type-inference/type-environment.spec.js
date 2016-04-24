import {expect} from "chai";
import Immutable from "immutable";

import Symbol, {SymbolFlags} from "../../lib/semantic-model/symbol";
import {Type, MaybeType, NumberType, StringType, TypeVariable} from "../../lib/semantic-model/types/index";
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

	describe("hasType", function () {
		it("returns true if the type environment contains a definition for the given symbol", function () {
			// arrange
			const name = new Symbol("name", SymbolFlags.Variable);
			const typeEnvironment = new TypeEnvironment().setType(name, new StringType());

			// act, assert
			expect(typeEnvironment.hasType(name)).to.be.true;
		});

		it("returns false if the type environment does not contain a definition for the given symbol", function () {
			// arrange
			const name = new Symbol("name", SymbolFlags.Variable);
			const age = new Symbol("age", SymbolFlags.Variable);
			const typeEnvironment = new TypeEnvironment().setType(name, new StringType());

			// act, assert
			expect(typeEnvironment.hasType(age)).to.be.false;
		});
	});

	describe("substitute", function () {
		it("returns a new type environment where the given type has been replaced", function () {
			// arrange
			const t = new Type("number");
			const newT = new Type("number");

			const x = new Symbol("x");
			const typeEnvironment = new TypeEnvironment(new Immutable.Map([[x, t]]));

			// act
			const substituted = typeEnvironment.substitute(t, newT);

			// assert
			expect(substituted).not.to.equal(typeEnvironment);
			expect(substituted.getType(x)).to.equal(newT);
		});

		it("returns a new type environment where the given type and all types that have used the given type as type parameter are replaced", function () {
			// arrange
			const t = new StringType();
			const newT = NumberType.create();
			const maybe = MaybeType.of(t);

			const x = new Symbol("x");
			const y = new Symbol("y");
			const typeEnvironment = new TypeEnvironment(new Immutable.Map([[x, t], [y, maybe]]));

			// act
			const substituted = typeEnvironment.substitute(t, newT);

			// assert
			expect(substituted.getType(y)).not.to.equal(maybe);
			expect(substituted.getType(y).of).to.equal(newT);
		});

		it("returns this if the old and new type are the same instance", function () {
			// arrange
			const t = new TypeVariable();

			const x = new Symbol("x");
			const y = new Symbol("y");

			const typeEnvironment = new TypeEnvironment()
				.setType(x, t)
				.setType(y, t);

			// act, assert
			expect(typeEnvironment.substitute(t, t)).to.equal(typeEnvironment);
		});
	});

	describe("difference", function () {
		it("returns a type environment containing newly added definitions", function () {
			// arrange
			const name = new Symbol("name", SymbolFlags.Variable);
			const age = new Symbol("age", SymbolFlags.Variable);

			const before = new TypeEnvironment().setType(name, new StringType());
			const after = before.setType(age, NumberType.create());

			// act
			const difference = after.difference(before);

			// assert
			expect(difference.hasType(name)).to.be.false;
			expect(difference.getType(age)).to.be.instanceOf(NumberType);
		});

		it("returns a type environment containing the changed definitions", function () {
			// arrange
			const name = new Symbol("name", SymbolFlags.Variable);
			const age = new Symbol("age", SymbolFlags.Variable);

			const before = new TypeEnvironment()
				.setType(name, new StringType())
				.setType(age, NumberType.create());
			const after = before.setType(age, MaybeType.of(NumberType.create()));

			// act
			const difference = after.difference(before);

			// assert
			expect(difference.hasType(name)).to.be.false;
			expect(difference.getType(age)).to.be.instanceOf(MaybeType);
		});

		it("returns an empty type environment if before and after are equal", function () {
			// arrange
			const name = new Symbol("name", SymbolFlags.Variable);
			const age = new Symbol("age", SymbolFlags.Variable);

			const before = new TypeEnvironment()
				.setType(name, new StringType())
				.setType(age, NumberType.create());

			// act
			const difference = before.difference(before);

			// assert
			expect(difference.isEmpty).to.be.true;
		});

		it("returns this if all mappings are new compared to the type environment before", function () {
			// arrange
			const name = new Symbol("name", SymbolFlags.Variable);
			const age = new Symbol("age", SymbolFlags.Variable);

			const before = new TypeEnvironment();
			const after = before
				.setType(name, new StringType())
				.setType(age, NumberType.create());

			// act
			const difference = after.difference(before);

			// assert
			expect(difference).to.equal(after);
		});
	});
});
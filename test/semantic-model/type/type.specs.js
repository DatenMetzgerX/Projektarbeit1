import {expect} from "chai";
import sinon from "sinon";
import {Type, MaybeType, TypeVariable} from "../../../lib/semantic-model/types/index";

describe("Type", function () {

	describe("resolved", function () {
		it("returns the type itself if the type has not been resolved to another type", function () {
			// arrange
			const numberType = new Type("number");

			// assert
			expect(numberType.resolved).to.equal(numberType);
		});

		it("returns the resolved type if this type has been resolved", function () {
			// arrange
			const numberType = new Type("number");
			const maybeType = new Type("maybe");

			maybeType.resolvesTo(numberType);

			// assert
			expect(maybeType.resolved).to.equal(numberType);
		});

		it("returns the resolved 'resolved type' if this type has been resolved and the resolved type has been resolved to", function () {
			// arrange
			const typeVariable = new Type("@");
			const numberType = new Type("number");
			const maybeType = new Type("maybe");

			typeVariable.resolvesTo(maybeType);
			maybeType.resolvesTo(numberType);

			// assert
			expect(typeVariable.resolved).to.equal(numberType);
		});
	});

	describe("resolveDeep", function () {
		it("returns the resolved type", function () {
			// arrange
			const numberType = new Type("number");
			const variable = new TypeVariable();

			variable.resolvesTo(numberType);

			// assert
			expect(variable.resolveDeep()).to.equal(numberType);
		});
	});

	describe("resolvesTo", function () {
		it("does not set the resolved to if the type to which it resolves is the same as this type", function () {
			const numberType = new Type("number");

			numberType.resolvesTo(numberType);

			// assert
			expect(numberType.resolved).to.equal(numberType);
		});
	});

	describe("isTypeVariable", function () {
		it("returns false", function () {
			// arrange
			const numberType = new Type("number");

			// act, assert
			expect(numberType.isTypeVariable).to.be.false;
		});
	});

	describe("isBaseType", function () {
		it ("returns true by default", function () {
			// arrange
			const numberType = new Type("number");

			// assert
			expect(numberType.isBaseType).to.be.true;
		});
	});

	describe("containsType", function () {
		it("returns false for two different type instances", function () {
			// arrange
			const t1 = new Type("number");
			const t2 = new Type("number");

			sinon.stub(t2, "containsType").returns(false);

			// act, assert
			expect(t1.occursIn(t2)).to.be.false;
		});

		it("returns true if the two types are the same instance and therefore equal", function () {
			// arrange
			const t1 = new Type("number");

			// act, assert
			expect(t1.containsType(t1)).to.be.true;
		});
	});

	describe("occursIn", function () {
		it("returns false if containsType of t2 returns false", function () {
			// arrange
			const t1 = new Type("number");
			const t2 = new Type("number");

			// act, assert
			expect(t1.occursIn(t2)).to.be.false;
		});

		it("returns true if the two types are the same instance and therefore equal", function () {
			// arrange
			const t1 = new Type("number");
			sinon.stub(t1, "containsType").returns(true);

			// act, assert
			expect(t1.occursIn(t1)).to.be.true;
		});
	});

	describe("prettyName", function () {
		it ("returns the name of the type", function () {
			expect(new Type("number").prettyName).to.equal("number");
		});
	});

	describe("toString", function () {
		it("returns the pretty name of the type", function () {
			// arrange
			const t1 = new (class extends Type {
				get prettyName() {
					return "I'm pretty";
				}
			})("number");

			// act, assert
			expect(t1.toString()).to.equal("I'm pretty");
		});

		it("returns the path to the resolved type if this type resolves to another type", function () {
			// arrange
			const t1 = new Type("@");
			t1.resolvesTo(new Type("number"));

			// act, assert
			expect(t1.toString()).to.equal("@ -> number");
		});
	});

	describe("isSameType", function () {
		it("returns true if both types have the same constructor (are from the same type)", function () {
			// arrange
			const first = new Type("number");
			const second = new Type("number");

			// act, assert
			expect(first.isSameType(second)).to.be.true;
		});

		it("returns true if both types have the same constructor but different type parameters", function () {
			// arrange
			const numberType = new Type("number");
			const stringType = new Type("string");
			const first = new Type("array", numberType);
			const second = new Type("array", stringType);

			// act, assert
			expect(first.isSameType(second)).to.be.true;
		});

		it("returns false if the types have not the same constructors", function () {
			// arrange
			const first = new Type("number");
			const second = new MaybeType(new Type("number"));

			// act, assert
			expect(first.isSameType(second)).to.be.false;
		});
	});

	describe("equals", function () {
		it("returns true if this is compared with itself", function () {
			// arrange
			const type = new Type("number");

			// act, assert
			expect(type.equals(type)).to.be.true;
		});

		it("returns false if the types are not from the same kind", function () {
			// arrange
			const first = new Type("number");
			const second = new MaybeType(new Type("number"));

			// act, assert
			expect(first.equals(second)).to.be.false;
		});
	});
});

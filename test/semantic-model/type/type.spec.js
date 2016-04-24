import {expect} from "chai";
import sinon from "sinon";
import {Type, MaybeType} from "../../../lib/semantic-model/types/index";

describe("Type", function () {

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

	describe("fresh", function () {
		it("returns a new instance with the same name as the original one", function () {
			// arrange
			const string = new Type("string");

			// act
			const fresh = string.fresh();

			// assert
			expect(fresh).not.to.equal(string);
			expect(fresh.name).to.equal(string.name);
		});

		it("returns a instance that has not the same id as the original one", function () {
			// arrange
			const string = new Type("string", 10);

			// act
			const fresh = string.fresh();

			// assert
			expect(fresh.id).not.to.equal(string.id);
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

	describe("substitute", function () {
		it("returns this if this type is not the same as the old type", function () {
			// arrange
			const t = new Type("number");

			// act, assert
			expect(t.substitute(new Type("number"), new Type("string"))).to.equal(t);
		});

		it("returns the new type if this type is the same as to the old type", function () {
			// arrange
			const t = new Type("number");
			const newType = new Type("Maybe");

			// act, assert
			expect(t.substitute(t, newType)).to.equal(newType);
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
			const second = MaybeType.of(new Type("number"));

			// act, assert
			expect(first.isSameType(second)).to.be.false;
		});
	});

	describe("same", function () {
		it("returns true if both types are the same reference", function () {
			// arrange
			const t = new Type("number");

			// act, assert
			expect(t.same(t)).to.be.true;
		});

		it("returns true if both types have the same id", function () {
			// arrange
			const t1 = new Type("number", 10);
			const t2 = new Type("number", 10);

			// act, assert
			expect(t1.same(t2)).to.be.true;
			expect(t2.same(t1)).to.be.true;
		});

		it("returns false if the types have different id's", function () {
			// arrange
			const t1 = new Type("number");
			const t2 = new Type("number");

			// act, assert
			expect(t1.same(t2)).to.be.false;
			expect(t2.same(t1)).to.be.false;
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
			const second = MaybeType.of(new Type("number"));

			// act, assert
			expect(first.equals(second)).to.be.false;
			expect(second.equals(first)).to.be.false;
		});
	});

	describe("isSubType", function () {
		it("returns true if the two types are equal", function () {
			// arrange
			const first = new Type("number");
			const second = new Type("number");

			// act, assert
			expect(first.isSubType(second)).to.be.true;
			expect(second.isSubType(first)).to.be.true;
		});

		it("returns false if the two types are not equal", function () {
			// arrange
			const first = new Type("number");
			const second = MaybeType.of(new Type("number"));

			// act, assert
			expect(first.isSubType(second)).to.be.false;
		});
	});
});

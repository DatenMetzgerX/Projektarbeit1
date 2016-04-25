import sinon from "sinon";
import {expect} from "chai";

import {RecordTypeUnificationRule} from "../../../lib/type-inference/unification-rules/record-type-unification-rule";
import {SymbolFlags, Symbol} from "../../../lib/semantic-model/symbol";
import {StringType, ObjectType, NumberType, NullType, MaybeType, RecordType} from "../../../lib/semantic-model/types";
import {TypeUnificator} from "../../../lib/type-inference/type-unificator";

describe("RecordTypeUnificationRule", function () {
	let unificator, rule, sandbox, name, age, lastName;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();

		unificator = new TypeUnificator([]);
		rule = new RecordTypeUnificationRule();
		name = new Symbol("name", SymbolFlags.Property);
		lastName = new Symbol("lastName", SymbolFlags.Property);
		age = new Symbol("age", SymbolFlags.Property);
	});

	afterEach(function () {
		sandbox = sinon.sandbox.restore();
	});

	describe("canUnify", function () {
		it("returns true for two record types with equal constructors", function () {
			// arrange
			const record = ObjectType.create([[name, StringType.create()], [age, NumberType.create()]]);
			const otherRecord = record.addProperty(lastName, StringType.create());

			// act, assert
			expect(rule.canUnify(record, otherRecord)).to.be.true;
		});

		it("returns false if the two record types are not from the same type", function () {
			// arrange
			const record = ObjectType.create([[name, StringType.create()], [age, NumberType.create()]]);
			const otherRecord = RecordType.create(RecordType, []);

			// act, assert
			expect(rule.canUnify(record, otherRecord)).to.be.false;
		});

		it("returns false if only one of both types is an object type", function () {
			// arrange
			const record = ObjectType.create([[name, StringType.create()], [age, NumberType.create()]]);

			// act, assert
			expect(rule.canUnify(record, StringType.create())).to.be.false;
			expect(rule.canUnify(StringType.create(), record)).to.be.false;
		});
	});

	describe("unify", function () {
		it ("returns the subset with the common properties of the two records", function () {
			// arrange
			const withAge = ObjectType.create([[name, StringType.create()], [age, NumberType.create()]]);
			const withLastName = ObjectType.create([[name, StringType.create()], [lastName, StringType.create()]]);

			sandbox.stub(unificator, "unify").returnsArg(0);

			// act
			const unified = rule.unify(withAge, withLastName, unificator);

			// assert
			expect(unified.hasProperty(name)).to.be.true;
			expect(unified.getType(name)).to.be.instanceOf(StringType);
			expect(unified.hasProperty(age)).to.be.false;
			expect(unified.hasProperty(lastName)).to.be.false;
		});

		it("returns the same record instance if one record is exactly the subset of the other record", function () {
			// arrange
			const smaller = ObjectType.create([[name, StringType.create()], [age, NumberType.create()]]);
			const larger = ObjectType.create([[name, StringType.create()], [age, NumberType.create()], [lastName, StringType.create()]]);

			sandbox.stub(unificator, "unify").returnsArg(0);

			// act
			const unified = rule.unify(smaller, larger, unificator);

			// assert
			expect(unified).to.equal(smaller);
		});

		it("unifies the types of the properties", function () {
			// arrange
			const withNameAsNull = ObjectType.create([[name, NullType.create()], [lastName, StringType.create()]]);
			const withNameAsString = ObjectType.create([[name, StringType.create()], [lastName, StringType.create(), [age, NumberType.create()]]]);

			sandbox.stub(unificator, "unify")
				.withArgs(sinon.match.instanceOf(StringType), sinon.match.instanceOf(StringType)).returnsArg(0)
				.withArgs(sinon.match.instanceOf(NullType), sinon.match.instanceOf(StringType)).returns(MaybeType.of(StringType.create()));

			// act
			const unified = rule.unify(withNameAsNull, withNameAsString, unificator);

			// assert
			expect(unified.getType(name)).to.be.instanceOf(MaybeType);
			expect(unified.getType(name).of).to.be.instanceOf(StringType);
		});
	});
});
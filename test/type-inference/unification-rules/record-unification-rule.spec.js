import sinon from "sinon";
import {expect} from "chai";

import {RecordUnificationRule} from "../../../lib/type-inference/unification-rules/record-unification-rule";
import {RefinementContext} from "../../../lib/type-inference/refinment-context";
import {SymbolFlags, Symbol} from "../../../lib/semantic-model/symbol";
import {StringType, RecordType, NumberType, NullType, MaybeType} from "../../../lib/semantic-model/types";

describe("RecordUnificationRule", function () {
	let context, rule, sandbox, name, age, lastName;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();

		context = new RefinementContext();
		rule = new RecordUnificationRule();
		name = new Symbol("name", SymbolFlags.Property);
		lastName = new Symbol("lastName", SymbolFlags.Property);
		age = new Symbol("age", SymbolFlags.Property);
	});

	afterEach(function () {
		sandbox = sinon.sandbox.restore();
	});

	describe("canUnify", function () {
		it("returns true for two record types", function () {
			// arrange
			const record = RecordType.withProperties([[name, new StringType()], [age, new NumberType()]]);
			const otherRecord = record.addProperty(lastName, new StringType());

			// act, assert
			expect(rule.canUnify(record, otherRecord)).to.be.true;
		});

		it("returns false if only one of both types is a record type", function () {
			// arrange
			const record = RecordType.withProperties([[name, new StringType()], [age, new NumberType()]]);

			// act, assert
			expect(rule.canUnify(record, new StringType())).to.be.false;
			expect(rule.canUnify(new StringType(), record)).to.be.false;
		});
	});

	describe("unify", function () {
		it ("returns the subset with the common properties of the two records", function () {
			// arrange
			const withAge = RecordType.withProperties([[name, new StringType()], [age, new NumberType()]]);
			const withLastName = RecordType.withProperties([[name, new StringType()], [lastName, new StringType()]]);

			sandbox.stub(context, "unify").returnsArg(0);

			// act
			const unified = rule.unify(withAge, withLastName, context);

			// assert
			expect(unified.hasProperty(name)).to.be.true;
			expect(unified.getType(name)).to.be.instanceOf(StringType);
			expect(unified.hasProperty(age)).to.be.false;
			expect(unified.hasProperty(lastName)).to.be.false;
		});

		it("returns the same record instance if one record is exactly the subset of the other record", function () {
			// arrange
			const smaller = RecordType.withProperties([[name, new StringType()], [age, new NumberType()]]);
			const larger = RecordType.withProperties([[name, new StringType()], [age, new NumberType()], [lastName, new StringType()]]);

			sandbox.stub(context, "unify").returnsArg(0);

			// act
			const unified = rule.unify(smaller, larger, context);

			// assert
			expect(unified).to.equal(smaller);
		});

		it("unifies the types of the properties", function () {
			// arrange
			const withNameAsNull = RecordType.withProperties([[name, new NullType()], [lastName, new StringType()]]);
			const withNameAsString = RecordType.withProperties([[name, new StringType()], [lastName, new StringType(), [age, new NumberType()]]]);

			sandbox.stub(context, "unify")
				.withArgs(sinon.match.instanceOf(StringType), sinon.match.instanceOf(StringType)).returnsArg(0)
				.withArgs(sinon.match.instanceOf(NullType), sinon.match.instanceOf(StringType)).returns(new MaybeType(new StringType()));

			// act
			const unified = rule.unify(withNameAsNull, withNameAsString, context);

			// assert
			expect(unified.getType(name)).to.be.instanceOf(MaybeType);
			expect(unified.getType(name).of).to.be.instanceOf(StringType);
		});

		it("returns t1 if t2 is RecordType.ANY", function () {
			// arrange
			const t1 = new RecordType();

			// act, assert
			expect(rule.unify(t1, RecordType.ANY, context)).to.equal(t1);
		});

		it("returns t2 if t1 is RecordType.ANY", function () {
			// arrange
			const t2 = new RecordType();

			// act, assert
			expect(rule.unify(RecordType.ANY, t2, context)).to.equal(t2);
		});
	});
});
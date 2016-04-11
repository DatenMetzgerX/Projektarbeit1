import {expect} from "chai";
import * as t from "babel-types";
import {LiteralRefinementRule} from "../../../lib/type-inference/refinement-rules/literal-refinement-rule";
import {StringType, NumberType, NullType, BooleanType} from "../../../lib/semantic-model/types";

describe("LiteralRefinementRule", function () {
	let rule;

	beforeEach(function () {
		rule = new LiteralRefinementRule();
	});

	describe("canRefine", function () {
		it ("returns true for a string literal", function () {
			// arrange
			const stringLiteral = t.stringLiteral("abcd");

			// act, assert
			expect(rule.canRefine(stringLiteral)).to.be.true;
		});

		it ("returns true for a number literal", function () {
			// arrange
			const numberLiteral = t.numericLiteral(10);

			// act, assert
			expect(rule.canRefine(numberLiteral)).to.be.true;
		});

		it ("returns true for the null literal", function () {
			// arrange
			const nullLiteral = t.nullLiteral();

			// act, assert
			expect(rule.canRefine(nullLiteral)).to.be.true;
		});

		it ("returns true for a boolean literal", function () {
			// arrange
			const boolLiteral = t.booleanLiteral(false);

			// act, assert
			expect(rule.canRefine(boolLiteral)).to.be.true;
		});

		it("returns false in the other cases", function () {
			// arrange
			const identifier = t.identifier("x");

			// act, assert
			expect(rule.canRefine(identifier)).to.be.false;
		});
	});

	describe("refine", function () {
		it("returns a StringType for a string literal", function () {
			// arrange
			const stringLiteral = t.stringLiteral("abcd");

			// act, assert
			expect(rule.refine(stringLiteral)).to.be.instanceOf(StringType);
		});

		it("returns a NumberType for a number literal", function () {
			// arrange
			const nullLiteral = t.numericLiteral(3);

			// act, assert
			expect(rule.refine(nullLiteral)).to.be.instanceOf(NumberType);
		});

		it("returns a BooleanType for a boolean literal", function () {
			// arrange
			const booleanLiteral = t.booleanLiteral(true);

			// act, assert
			expect(rule.refine(booleanLiteral)).to.be.instanceOf(BooleanType);
		});

		it("returns a NullType for a null literal", function () {
			// arrange
			const nullLiteral = t.nullLiteral();

			// act, assert
			expect(rule.refine(nullLiteral)).to.be.instanceOf(NullType);
		});
	});
});
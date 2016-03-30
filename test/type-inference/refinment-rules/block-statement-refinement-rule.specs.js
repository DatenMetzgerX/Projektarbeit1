import {expect} from "chai";
import * as t from "babel-types";

import {BlockStatementRefinementRule} from "../../../lib/type-inference/refinement-rules/block-statement-refinement-rule";
import {VoidType} from "../../../lib/semantic-model/types";

describe("BlockStatementRefinementRule", function () {
	let rule, blockStatement;

	beforeEach(function () {
		rule = new BlockStatementRefinementRule();
		blockStatement = t.blockStatement([]);
	});

	describe("canRefine", function () {
		it("returns true for a block statement", function () {
			expect(rule.canRefine(blockStatement)).to.be.true;
		});

		it("returns false otherwise", function () {
			expect(rule.canRefine(t.numericLiteral(4))).to.be.false;
		});
	});

	describe("refine", function () {
		it("returns VoidType", function () {
			expect(rule.refine(blockStatement, context)).to.be.instanceOf(VoidType);
		});
	});
});
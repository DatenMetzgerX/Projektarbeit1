import {expect} from "chai";
import * as t from "babel-types";

import {Program} from "../../../lib/semantic-model/program";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";
import {VoidType} from "../../../lib/semantic-model/types";
import {BreakStatementRefinementRule} from "../../../lib/type-inference/refinement-rules/break-statement-refinement-rule";

describe("BreakStatementRefinementRule", function () {
	let context, rule, program;

	beforeEach(function () {
		program = new Program();
		context = new HindleyMilnerContext(null, new TypeInferenceContext(program));
		rule = new BreakStatementRefinementRule();
	});

	describe("canRefine", function () {
		it("returns true if the node is a break statement", function () {
			expect(rule.canRefine(t.breakStatement())).to.be.true;
		});

		it("returns false if the node is not a break statement", function () {
			expect(rule.canRefine(t.identifier("x"))).to.be.false;
		});
	});

	describe("refine", function () {
		it ("returns type void", function () {
			expect(rule.refine(t.breakStatement(), context)).to.be.instanceOf(VoidType);
		});
	});
});
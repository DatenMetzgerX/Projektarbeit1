import sinon from "sinon";
import {expect} from "chai";
import * as t from "babel-types";

import {Program} from "../../../lib/semantic-model/program";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";
import {TemplateLiteralRefinementRule} from "../../../lib/type-inference/refinement-rules/template-literal-refinement-rule";
import {StringType, NumberType} from "../../../lib/semantic-model/types";

describe("TemplateLiteralRefinementRule", function () {
	let context, rule, templateLiteral;

	beforeEach(function () {
		context = new HindleyMilnerContext(null, new TypeInferenceContext(new Program()));
		rule = new TemplateLiteralRefinementRule();
		templateLiteral = t.templateLiteral([t.templateElement("Hello"), t.templateElement("")], [t.identifier("user")]); // Hello ${user}
	});

	describe("canRefine", function () {
		it("returns true if the node is a template literal", function () {
			expect(rule.canRefine(templateLiteral)).to.be.true;
		});

		it("returns false if the node is not a template literal", function () {
			expect(rule.canRefine(t.identifier("x"))).to.be.false;
		});
	});

	describe("refine", function () {
		it ("returns type string", function () {
			// arrange
			sinon.stub(context, "infer").returns(NumberType.create());

			// act, assert
			expect(rule.refine(templateLiteral, context)).to.be.instanceOf(StringType);
		});

		it ("infers the type of the expressions", function () {
			// arrange
			sinon.stub(context, "infer").returns(StringType.create());

			// assert
			rule.refine(templateLiteral, context);

			// assert
			sinon.assert.calledWith(context.infer, templateLiteral.expressions[0]);
		});
	});
});
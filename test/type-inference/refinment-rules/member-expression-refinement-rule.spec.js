import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import {Symbol, SymbolFlags} from "../../../lib/semantic-model/symbol";
import {StringType, RecordType, VoidType} from "../../../lib/semantic-model/types";
import {RefinementContext} from "../../../lib/type-inference/refinment-context";
import {MemberExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/member-expression-refinement-rule";

describe("MemberExpressionRefinementRule", function () {
	let rule, context, memberExpression, sandbox;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();
		context = new RefinementContext();

		sandbox.stub(context, "getType");
		sandbox.stub(context, "getSymbol");
		sandbox.stub(context, "unify");

		rule = new MemberExpressionRefinementRule();
		memberExpression = t.memberExpression(t.identifier("person"), t.identifier("name"));
	});

	afterEach(function () {
		sandbox.restore();
	});

	describe("canRefine", function () {
		it("returns true for a member expression", function () {
			expect(rule.canRefine(memberExpression)).to.be.true;
		});

		it("returns false otherwise", function () {
			expect(rule.canRefine(t.numericLiteral(4))).to.be.false;
		});
	});

	describe("refine", function () {

		it("returns the type of the member for known properties", function () {
			const personSymbol = new Symbol("person", SymbolFlags.Variable);
			const nameSymbol = new Symbol("name", SymbolFlags.Property);
			personSymbol.addMember(nameSymbol);

			context.getSymbol.withArgs(memberExpression.object).returns(personSymbol);
			context.getSymbol.withArgs(memberExpression.property).returns(nameSymbol);

			const personType = RecordType.withProperties([[nameSymbol, new StringType()]]);
			context.getType.withArgs(personSymbol).returns(personType);

			context.unify.withArgs(RecordType.ANY, personType).returns(personType);

			// act
			const refined = rule.refine(memberExpression, context);

			// assert
			expect(refined).to.be.instanceOf(StringType);
		});

		/**
		 * The forward analysis infers what is known about a type and not what is required about a type.
		 * Therefore if a member is accessed before it's explicit declaration (e.g. assignment, object literal...), then
		 * we won't create a property for the record as it is not 100% sure if the record has this type. All that is known
		 * is that the property therefor mgiht be of the type undefined, so lets return undefined.
		 */
		it("returns void for unknown members", function () {
			// arrange
			const nameSymbol = new Symbol("name", SymbolFlags.Property);
			const personSymbol = new Symbol("person", SymbolFlags.Variable);
			personSymbol.addMember(nameSymbol);

			context.getSymbol.withArgs(memberExpression.property).returns(nameSymbol);
			context.getSymbol.withArgs(memberExpression.object).returns(personSymbol);

			const personType = new RecordType();
			context.getType.withArgs(personSymbol).returns(personType);

			context.unify.withArgs(RecordType.ANY, personType).returns(personType);

			// act
			const refined = rule.refine(memberExpression, context);

			// assert
			expect(refined).to.be.instanceOf(VoidType);
		});

		/**
		 * This can only be the case if a variable is accessed that has not been declared in this scope and therefore is invalid
		 * anyway. In this case we return undefined as we assume that the member does not exist and therefor will not have a value
		 */
		it("returns void if the object type is not yet known", function () {
			// arrange
			const nameSymbol = new Symbol("name", SymbolFlags.Property);
			const personSymbol = new Symbol("person", SymbolFlags.Variable);
			personSymbol.addMember(nameSymbol);

			context.getSymbol.withArgs(memberExpression.property).returns(nameSymbol);
			context.getSymbol.withArgs(memberExpression.object).returns(personSymbol);

			context.unify.withArgs(RecordType.ANY).returns(new RecordType());

			// act
			const refined = rule.refine(memberExpression, context);

			// assert
			expect(refined).to.be.instanceOf(VoidType);
		});
	});
});
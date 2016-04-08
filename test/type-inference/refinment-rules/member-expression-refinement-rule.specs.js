import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import {Symbol, SymbolFlags} from "../../../lib/semantic-model/symbol";
import {TypeVariable, StringType} from "../../../lib/semantic-model/types";
import {RefinementContext} from "../../../lib/type-inference/refinment-context";
import {MemberExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/member-expression-refinement-rule";

describe("MemberExpressionRefinementRule", function () {
	let rule, context, memberExpression, sandbox;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();
		context = new RefinementContext();

		sandbox.stub(context, "setType");
		sandbox.stub(context, "getType");
		sandbox.stub(context, "getSymbol");

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
		it("creates a fresh type variable and assigns it with the member symbol in the type environment", function () {
			const personSymbol = new Symbol("person", SymbolFlags.Variable);
			const nameSymbol = new Symbol("name", SymbolFlags.Property);
			personSymbol.addMember(nameSymbol);

			context.getSymbol.withArgs(memberExpression.object).returns(personSymbol);
			context.getSymbol.withArgs(memberExpression.property).returns(nameSymbol);

			// act
			rule.refine(memberExpression, context);

			// assert
			sinon.assert.calledWith(context.setType, nameSymbol, sinon.match.instanceOf(TypeVariable));
		});

		it("returns the type from the type environment if the member symbol has a type assigned in the type environment", function () {
			const personSymbol = new Symbol("person", SymbolFlags.Variable);
			const nameSymbol = new Symbol("name", SymbolFlags.Property);
			personSymbol.addMember(nameSymbol);

			context.getSymbol.withArgs(memberExpression.object).returns(personSymbol);
			context.getSymbol.withArgs(memberExpression.property).returns(nameSymbol);
			context.getType.withArgs(nameSymbol).returns(new StringType());

			// act
			const refined = rule.refine(memberExpression, context);

			// assert
			expect(refined).to.be.instanceOf(StringType);
		});

		/**
		 * The forward analysis infers what is known about a type and not what is required about a type.
		 * Therefore if a member is accessed before it's explicit declaration (e.g. assignment, object literal...), then
		 * we won't create a property for the record as it is not 100% sure if the record has this type. But
		 * a new type variable is created and associated with the symbol of this member in the type environment.
		 * This to ensure that the type can be merged if a backward analysis is performed too.
		 */
		it("initializes the type in the type environment for unknown members", function () {
			// arrange
			const nameSymbol = new Symbol("name", SymbolFlags.Property);
			const personSymbol = new Symbol("person", SymbolFlags.Variable);
			personSymbol.addMember(nameSymbol);

			context.getSymbol.withArgs(memberExpression.property).returns(nameSymbol);
			context.getSymbol.withArgs(memberExpression.object).returns(personSymbol);

			// act
			const refined = rule.refine(memberExpression, context);

			// assert
			expect(refined).to.be.instanceOf(TypeVariable);
			sinon.assert.calledWith(context.setType, nameSymbol, sinon.match.instanceOf(TypeVariable));
		});
	});
});
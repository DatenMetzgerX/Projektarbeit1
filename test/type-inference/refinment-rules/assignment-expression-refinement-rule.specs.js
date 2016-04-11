import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import BINARY_OPERATORS from "../../../lib/type-inference/refinement-rules/binary-operators";
import {RefinementContext} from "../../../lib/type-inference/refinment-context";
import {AssignmentExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/assignment-expression-refinement-rule";
import {NumberType, NullType, StringType, RecordType} from "../../../lib/semantic-model/types";
import {SymbolFlags, Symbol} from "../../../lib/semantic-model/symbol";

describe("AssignmentExpressionRefinementRule", function () {
	let rule, context, assignmentExpression, sandbox;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();
		context = new RefinementContext();
		sandbox.stub(context, "unify");
		sandbox.stub(context, "infer");
		sandbox.stub(context, "getSymbol");
		sandbox.stub(context, "getType");
		sandbox.stub(context, "setType");
		sandbox.stub(context, "replaceType");
		rule = new AssignmentExpressionRefinementRule();
		assignmentExpression = t.assignmentExpression("=", t.identifier("x"), t.numericLiteral(5));
	});

	afterEach(function () {
		sandbox.restore();
	});

	describe("canRefine", function () {
		it("returns true for a assignment expression", function () {
			expect(rule.canRefine(assignmentExpression)).to.be.true;
		});

		it("returns false otherwise", function () {
			expect(rule.canRefine(t.numericLiteral(4))).to.be.false;
		});
	});

	describe("refine", function () {
		describe("=", function () {
			it("returns the type of the right hand side if the left hand side is a type variable", function () {
				// arrange
				const xSymbol = new Symbol("x", SymbolFlags.Variable);
				context.getSymbol.returns(xSymbol);
				context.unify.returnsArg(0);
				context.infer.returns(new NumberType());

				// act, assert
				expect(rule.refine(assignmentExpression, context)).to.be.instanceOf(NumberType);
			});

			it("sets the type of the assignee in the type environment", function () {
				// arrange
				const xSymbol = new Symbol("x", SymbolFlags.Variable);
				context.getSymbol.returns(xSymbol);
				context.unify.returnsArg(0);
				context.infer.returns(new NumberType());

				// act
				rule.refine(assignmentExpression, context);

				// assert
				sinon.assert.calledWithExactly(context.setType, xSymbol, sinon.match.instanceOf(NumberType));
			});
		});

		describe("BinaryOperatorAssignment", function () {
			it("throws if the operator is not supported", function () {
				// arrange
				const illegalAssignmentOperator = t.assignmentExpression("$=", t.identifier("x"), t.numericLiteral(4));

				// act, assert
				expect(() => rule.refine(illegalAssignmentOperator, context)).to.throw("Type inference failure: The assignment operator $= is not supported");
			});

			it("uses the binary operator with the given name to refine the type", function () {
				// arrange
				const plusAssignment = t.assignmentExpression("+=", t.identifier("x"), t.numericLiteral(4));
				const xType = new NullType();
				const numberType = new NumberType();

				sandbox.stub(BINARY_OPERATORS["+"], "refine").returns(new NumberType());

				context.infer.withArgs(plusAssignment.left).returns(xType);
				context.infer.withArgs(plusAssignment.right).returns(numberType);

				// act
				const refined = rule.refine(plusAssignment, context);

				// assert
				sinon.assert.calledWithExactly(BINARY_OPERATORS["+"].refine, xType, numberType, sinon.match.func);
				expect(refined).to.be.instanceOf(NumberType);
			});

			it("sets the (updated) type for the assignee in the type environment", function () {
				// arrange
				const plusAssignment = t.assignmentExpression("+=", t.identifier("x"), t.numericLiteral(4));
				const x = new Symbol("x", SymbolFlags.Variable);
				const xType = new NullType();
				const numberType = new NumberType();

				context.getSymbol.withArgs(plusAssignment.left).returns(x);

				context.infer.withArgs(plusAssignment.left).returns(xType);
				context.infer.withArgs(plusAssignment.right).returns(numberType);
				sandbox.stub(BINARY_OPERATORS["+"], "refine").returns(numberType);

				// act
				rule.refine(plusAssignment, context);

				// assert
				sinon.assert.calledWith(context.setType, x, sinon.match.instanceOf(NumberType));
			});
		});

		describe("members", function () {
			let memberExpression = t.memberExpression(t.identifier("person"), t.identifier("name"));
			let assignmentToMember = t.assignmentExpression("=", memberExpression, t.stringLiteral("Micha"));

			it("replaces the record of the target object with one that includes the new property", function () {
				// arrange
				const personSymbol = new Symbol("person", SymbolFlags.Variable);
				const name = new Symbol("name", SymbolFlags.Property);
				personSymbol.addMember(name);
				const person = new RecordType();

				context.getSymbol.withArgs(memberExpression.object).returns(personSymbol);
				context.getSymbol.withArgs(memberExpression.property).returns(name);

				context.getType.withArgs(personSymbol).returns(person);
				context.infer.withArgs(assignmentToMember.right).returns(new StringType());

				context.unify.withArgs(sinon.match.instanceOf(RecordType), person).returns(person);

				// act, assert
				expect(rule.refine(assignmentToMember, context)).to.be.instanceOf(StringType);

				// has the record been updated
				sinon.assert.calledWith(context.replaceType, personSymbol);

				const replaceTypeCallback = context.replaceType.getCall(0).args[1];
				const newType = replaceTypeCallback(person);
				expect(newType.getType(name)).to.be.instanceOf(StringType);
			});

			it("updates the type of the property if the target object already has a property with the same name", function () {
				// arrange
				const personSymbol = new Symbol("person", SymbolFlags.Variable);
				const name = new Symbol("name", SymbolFlags.Property);
				personSymbol.addMember(name);
				const person = new RecordType();
				person.addProperty(name, new NullType());

				context.getSymbol.withArgs(memberExpression.object).returns(personSymbol);
				context.getSymbol.withArgs(memberExpression.property).returns(name);

				context.getType.withArgs(personSymbol).returns(person);
				context.infer.withArgs(assignmentToMember.right).returns(new StringType());

				context.unify.withArgs(sinon.match.instanceOf(RecordType), person).returns(person);

				// act, assert
				expect(rule.refine(assignmentToMember, context)).to.be.instanceOf(StringType);
				sinon.assert.calledWith(context.replaceType, personSymbol);

				const replaceTypeCallback = context.replaceType.getCall(0).args[1];
				const newType = replaceTypeCallback(person);
				expect(newType.getType(name)).to.be.instanceOf(StringType);
			});
		});
	});
});
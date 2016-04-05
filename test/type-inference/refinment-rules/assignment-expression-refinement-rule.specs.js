import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import BINARY_OPERATORS from "../../../lib/type-inference/refinement-rules/binary-operators";
import {RefinementContext} from "../../../lib/type-inference/refinment-context";
import {AssignmentExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/assignment-expression-refinement-rule";
import {NumberType, NullType, StringType, RecordType, TypeVariable, VoidType, MaybeType} from "../../../lib/semantic-model/types";
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
				const xSymbol = new Symbol("x", SymbolFlags.Variable);
				const xType = new NullType();
				const numberType = new NumberType();

				context.getSymbol.withArgs(plusAssignment.left).returns(xSymbol);
				sandbox.stub(BINARY_OPERATORS["+"], "refine").returns(new NumberType());

				context.infer.withArgs(plusAssignment.left).returns(xType);
				context.infer.withArgs(plusAssignment.right).returns(numberType);

				// act
				rule.refine(plusAssignment, context);

				// assert
				sinon.assert.calledWith(context.setType, xSymbol, numberType);
			});
		});

		describe("members", function () {
			let memberExpression = t.memberExpression(t.identifier("person"), t.identifier("name"));
			let assignmentToMember = t.assignmentExpression("=", memberExpression, t.stringLiteral("Micha"));

			it("adds a new property to the target object", function () {
				// arrange
				const personSymbol = new Symbol("person", SymbolFlags.Variable);
				const name = new Symbol("name", SymbolFlags.Property);
				personSymbol.addMember(name);
				const person = new RecordType();

				context.getSymbol.withArgs(memberExpression.object).returns(personSymbol);
				context.getSymbol.withArgs(memberExpression.property).returns(name);

				context.getType.withArgs(personSymbol).returns(person);
				context.infer.withArgs(assignmentToMember.right).returns(new StringType());

				// act, assert
				expect(rule.refine(assignmentToMember, context)).to.be.instanceOf(StringType);
				expect(person.getType(name)).to.be.instanceOf(StringType);
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

				// act, assert
				expect(rule.refine(assignmentToMember, context)).to.be.instanceOf(StringType);
				expect(person.getType(name)).to.be.instanceOf(StringType);
			});

			it("resolves the type of the target object to Record if it currently is a TypeVariable", function () {
				// arrange
				const personSymbol = new Symbol("person", SymbolFlags.Variable);
				const name = new Symbol("name", SymbolFlags.Property);
				personSymbol.addMember(name);

				const person = new TypeVariable();

				context.getSymbol.withArgs(memberExpression.object).returns(personSymbol);
				context.getSymbol.withArgs(memberExpression.property).returns(name);

				context.getType.withArgs(personSymbol).returns(person);
				context.infer.withArgs(assignmentToMember.right).returns(new StringType());

				// act
				rule.refine(assignmentToMember, context);

				// assert
				expect(person.resolved).to.be.instanceOf(RecordType);
			});

			it("throws a null pointer exception if the object has the type NullType", function () {
				// arrange
				const personSymbol = new Symbol("person", SymbolFlags.Variable);
				const nameSymbol = new Symbol("name", SymbolFlags.Property);
				personSymbol.addMember(nameSymbol);

				const person = new NullType();

				context.getSymbol.withArgs(memberExpression.object).returns(personSymbol);
				context.getSymbol.withArgs(memberExpression.property).returns(nameSymbol);

				context.getType.withArgs(personSymbol).returns(person);

				// act, assert
				expect(() => rule.refine(assignmentToMember, context)).to.throw("Type inference failure: Potential null pointer access, object person is inferred as type null that could potentially be null.");
			});

			it("throws a null pointer exception if the object has the type VoidType", function () {
				// arrange
				const personSymbol = new Symbol("person", SymbolFlags.Variable);
				const nameSymbol = new Symbol("name", SymbolFlags.Property);
				personSymbol.addMember(nameSymbol);

				const person = new VoidType();

				context.getSymbol.withArgs(memberExpression.object).returns(personSymbol);
				context.getSymbol.withArgs(memberExpression.property).returns(nameSymbol);

				context.getType.withArgs(personSymbol).returns(person);

				// act, assert
				expect(() => rule.refine(assignmentToMember, context)).to.throw("Type inference failure: Potential null pointer access, object person is inferred as type undefined that could potentially be null.");
			});

			it("throws a null pointer exception if the object has the type Maybe<T>", function () {
				// arrange
				const personSymbol = new Symbol("person", SymbolFlags.Variable);
				const nameSymbol = new Symbol("name", SymbolFlags.Property);
				personSymbol.addMember(nameSymbol);

				const person = new MaybeType(new RecordType());

				context.getSymbol.withArgs(memberExpression.object).returns(personSymbol);
				context.getSymbol.withArgs(memberExpression.property).returns(nameSymbol);

				context.getType.withArgs(personSymbol).returns(person);

				// act, assert
				expect(() => rule.refine(assignmentToMember, context)).to.throw("Type inference failure: Potential null pointer access, object person is inferred as type Maybe<{}> that could potentially be null.");
			});
		});
	});
});
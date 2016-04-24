import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import BINARY_OPERATORS from "../../../lib/type-inference/refinement-rules/binary-operators";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {AssignmentExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/assignment-expression-refinement-rule";
import {NumberType, NullType, StringType, RecordType} from "../../../lib/semantic-model/types";
import {SymbolFlags, Symbol} from "../../../lib/semantic-model/symbol";
import Program from "../../../lib/semantic-model/program";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";

describe("AssignmentExpressionRefinementRule", function () {
	let rule, context, program, assignmentExpression, sandbox;

	beforeEach(function () {
		program = new Program();
		context = new HindleyMilnerContext(null, new TypeInferenceContext(program));

		sandbox = sinon.sandbox.create();
		sandbox.stub(context, "unify");
		sandbox.stub(context, "infer");

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
				program.symbolTable.setSymbol(assignmentExpression.left, xSymbol);
				context.unify.returnsArg(0);
				context.infer.returns(NumberType.create());

				// act, assert
				expect(rule.refine(assignmentExpression, context)).to.be.instanceOf(NumberType);
			});

			it("sets the type of the assignee in the type environment", function () {
				// arrange
				const xSymbol = new Symbol("x", SymbolFlags.Variable);
				program.symbolTable.setSymbol(assignmentExpression.left, xSymbol);
				context.unify.returnsArg(0);
				context.infer.returns(NumberType.create());

				// act
				rule.refine(assignmentExpression, context);

				// assert
				expect(context.getType(xSymbol)).to.be.instanceOf(NumberType);
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
				const xType = NullType.create();
				const numberType = NumberType.create();
				program.symbolTable.setSymbol(plusAssignment.left, new Symbol("x", SymbolFlags.Variable));

				sandbox.stub(BINARY_OPERATORS["+"], "refine").returns(NumberType.create());

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

				program.symbolTable.setSymbol(plusAssignment.left, x);

				const xType = NullType.create();
				const numberType = NumberType.create();

				context.infer.withArgs(plusAssignment.left).returns(xType);
				context.infer.withArgs(plusAssignment.right).returns(numberType);
				sandbox.stub(BINARY_OPERATORS["+"], "refine").returns(numberType);

				// act
				rule.refine(plusAssignment, context);

				// assert
				expect(context.getType(x)).to.be.instanceOf(NumberType);
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

				program.symbolTable.setSymbol(memberExpression.object, personSymbol);
				program.symbolTable.setSymbol(memberExpression.property, name);

				context.setType(personSymbol, person);

				context.infer.withArgs(assignmentToMember.right).returns(new StringType());
				context.unify.withArgs(sinon.match.instanceOf(RecordType), person).returns(person);

				// act, assert
				expect(rule.refine(assignmentToMember, context)).to.be.instanceOf(StringType);
				expect(context.getType(personSymbol).getType(name)).to.be.instanceOf(StringType);
			});

			it("updates the type of the property if the target object already has a property with the same name", function () {
				// arrange
				const personSymbol = new Symbol("person", SymbolFlags.Variable);
				const name = new Symbol("name", SymbolFlags.Property);
				personSymbol.addMember(name);
				const person = new RecordType();
				person.addProperty(name, NullType.create());

				program.symbolTable.setSymbol(memberExpression.object, personSymbol);
				program.symbolTable.setSymbol(memberExpression.property, name);
				context.setType(personSymbol, person);

				context.infer.withArgs(assignmentToMember.right).returns(new StringType());
				context.unify.withArgs(sinon.match.instanceOf(RecordType), person).returns(person);

				// act, assert
				expect(rule.refine(assignmentToMember, context)).to.be.instanceOf(StringType);
				expect(context.getType(personSymbol).getType(name)).to.be.instanceOf(StringType);
			});
		});
	});
});
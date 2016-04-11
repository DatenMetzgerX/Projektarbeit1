import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import {Symbol, SymbolFlags} from "../../../lib/semantic-model/symbol";
import {StringType, RecordType, VoidType} from "../../../lib/semantic-model/types";
import {RefinementContext} from "../../../lib/type-inference/refinement-context";
import {MemberExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/member-expression-refinement-rule";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";
import {Program} from "../../../lib/semantic-model/program";

describe("MemberExpressionRefinementRule", function () {
	let rule, context, program, memberExpression, sandbox;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();
		program = new Program();
		context = new RefinementContext(null, new TypeInferenceContext(program));

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

			program.symbolTable.setSymbol(memberExpression.object, personSymbol);
			program.symbolTable.setSymbol(memberExpression.property, nameSymbol);

			const personType = RecordType.withProperties([[nameSymbol, new StringType()]]);
			context.setType(personSymbol, personType);

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

			program.symbolTable.setSymbol(memberExpression.object, personSymbol);
			program.symbolTable.setSymbol(memberExpression.property, nameSymbol);

			const personType = new RecordType();
			context.setType(personSymbol, personType);

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

			program.symbolTable.setSymbol(memberExpression.object, personSymbol);
			program.symbolTable.setSymbol(memberExpression.property, nameSymbol);

			context.unify.withArgs(RecordType.ANY).returns(new RecordType());

			// act
			const refined = rule.refine(memberExpression, context);

			// assert
			expect(refined).to.be.instanceOf(VoidType);
		});
	});
});
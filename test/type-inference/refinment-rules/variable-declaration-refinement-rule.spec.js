import sinon from "sinon";
import {expect} from "chai";
import * as t from "babel-types";

import {VariableDeclarationRefinementRule} from "../../../lib/type-inference/refinement-rules/variable-declaration-refinement-rule";
import {RefinementContext} from "../../../lib/type-inference/refinment-context";
import {SymbolFlags, Symbol} from "../../../lib/semantic-model/symbol";
import {StringType, VoidType, NumberType} from "../../../lib/semantic-model/types";

describe("VariableDeclarationRefinementRule", function () {
	let rule, context;

	beforeEach(function () {
		context = new RefinementContext();
		rule = new VariableDeclarationRefinementRule();
	});

	describe("canRefine", function () {
		it ("returns true for a variable declarator", function () {
			// arrange
			const declarator = t.variableDeclarator(t.identifier("x"), t.stringLiteral("abd"));

			// act, assert
			expect(rule.canRefine(declarator)).to.be.true;
		});

		it ("returns true for a variable declaration", function () {
			// arrange
			const declaration = t.variableDeclaration("let", [t.variableDeclarator(t.identifier("x"), t.stringLiteral("abd"))]);

			// act, assert
			expect(rule.canRefine(declaration)).to.be.true;
		});

		it("returns false for other types", function () {
			expect(rule.canRefine(t.stringLiteral("abcd"))).to.be.false;
		});
	});

	describe("refine", function () {
		describe("VariableDeclarator", function () {
			it ("returns the type of the init expression if the declarator has an init expression", function () {
				// arrange
				const identifier = t.identifier("x");
				const declarator = t.variableDeclarator(identifier, t.stringLiteral("abcd"));
				const symbol = new Symbol("x", SymbolFlags.Variable);

				sinon.stub(context, "getSymbol").withArgs(identifier).returns(symbol);
				sinon.stub(context, "infer").returns(new StringType());
				sinon.stub(context, "setType");

				// act
				const refined = rule.refine(declarator, context);

				// assert
				expect(refined).to.be.instanceOf(StringType);
			});

			it ("updates the type of the variable declarator in the type environment if the declarator has an init expression", function () {
				// arrange
				const identifier = t.identifier("x");
				const declarator = t.variableDeclarator(identifier, t.stringLiteral("abcd"));
				const symbol = new Symbol("x", SymbolFlags.Variable);

				sinon.stub(context, "getSymbol").returns(symbol);
				sinon.stub(context, "infer").returns(new StringType());
				sinon.stub(context, "setType");

				// act
				rule.refine(declarator, context);

				// assert
				sinon.assert.calledWith(context.setType, symbol, sinon.match.instanceOf(StringType));
			});

			it("returns VoidType if the declarator has no init expression", function () {
				// arrange
				const identifier = t.identifier("x");
				const declarator = t.variableDeclarator(identifier);
				const symbol = new Symbol("x", SymbolFlags.Variable);

				sinon.stub(context, "getSymbol").withArgs(identifier).returns(symbol);
				sinon.stub(context, "setType");

				// act
				const refined = rule.refine(declarator, context);

				// assert
				expect(refined).to.be.instanceOf(VoidType);
				sinon.assert.calledWith(context.setType, symbol, sinon.match.instanceOf(VoidType));
			});
		});

		describe("VariableDeclaration", function () {
			it("returns VoidType", function () {
				// arrange
				const declaration = t.variableDeclaration("let", [t.variableDeclarator(t.identifier("x"), t.stringLiteral("abd"))]);
				sinon.stub(context, "infer").returns(new StringType());
				sinon.stub(context, "getSymbol").returns(new Symbol("x", SymbolFlags.Variable));
				sinon.stub(context, "setType");

				// act, assert
				expect(rule.refine(declaration, context)).to.be.instanceOf(VoidType);
			});

			it("infers the types of all variable declarators in this variable declaration", function () {
				// arrange
				sinon.stub(context, "infer");
				sinon.stub(context, "setType");
				sinon.stub(context, "getSymbol");

				const x = t.variableDeclarator(t.identifier("x"), t.stringLiteral("abcd"));
				const xSymbol = new Symbol("x", SymbolFlags.Variable);
				context.getSymbol.withArgs(x.id).returns(xSymbol);
				context.infer.withArgs(x.init).returns(new StringType());

				const y = t.variableDeclarator(t.identifier("y"), t.numericLiteral(5));
				const ySymbol = new Symbol("y", SymbolFlags.Variable);
				context.getSymbol.withArgs(y.id).returns(ySymbol);
				context.infer.withArgs(y.init).returns(new NumberType());

				const declaration = t.variableDeclaration("let", [x, y]);

				// act
				const refined = rule.refine(declaration, context);

				// assert
				sinon.assert.calledWith(context.setType, xSymbol, sinon.match.instanceOf(StringType));
				sinon.assert.calledWith(context.setType, ySymbol, sinon.match.instanceOf(NumberType));

				expect(refined).to.be.instanceOf(VoidType);
			});
		});
	});
});
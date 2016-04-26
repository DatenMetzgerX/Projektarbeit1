import {expect} from "chai";
import * as t from "babel-types";
import {IdentifierRefinementRule} from "../../../lib/type-inference/refinement-rules/identifier-refinement-rule";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {VoidType, NumberType} from "../../../lib/semantic-model/types";
import {SymbolFlags, Symbol} from "../../../lib/semantic-model/symbol";
import {Program} from "../../../lib/semantic-model/program";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";

describe("IdentifierRefinementRule", function () {
	let rule, context, program;

	beforeEach(function () {
		program = new Program();
		context = new HindleyMilnerContext(null, new TypeInferenceContext(program));
		rule = new IdentifierRefinementRule();
	});

	describe("canRefine", function () {
		it("returns true for an identifier", function () {
			// arrange
			const identifier = t.identifier("x");

			// act, assert
			expect(rule.canRefine(identifier)).to.be.true;
		});

		it("returns false for other nodes", function () {
			// arrange
			const stringLiteral = t.stringLiteral("x");

			// act, assert
			expect(rule.canRefine(stringLiteral)).to.be.false;
		});
	});

	describe("refine", function () {
		it("returns UndefinedType for the undefined identifier", function () {
			// arrange
			const undefinedIdentifier = t.identifier("undefined");

			// act, assert
			expect(rule.refine(undefinedIdentifier, context)).to.be.instanceOf(VoidType);
		});

		it("resolves the type from the type environment", function () {
			// arrange
			const identifier = t.identifier("x");
			const type = NumberType.create();
			const symbol = new Symbol("x", SymbolFlags.Variable);
			program.symbolTable.setSymbol(identifier, symbol);
			context.setType(symbol, type);

			// act
			const refinedType = rule.refine(identifier, context);

			// assert
			expect(refinedType).to.be.instanceOf(NumberType);
		});

		it("throws an error if type of the identifier is not know and therefor the identifier has been used before it's declaration", function () {
			// arrange
			const identifier = t.identifier("x");
			const symbol = new Symbol("x", SymbolFlags.Variable);
			program.symbolTable.setSymbol(identifier, symbol);

			// act
			expect(() => rule.refine(identifier, context)).to.throw("Type inference failure: The symbol x is being used before it's declaration");
		});
	});
});
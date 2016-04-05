import {expect} from "chai";

import {Program} from "../../lib/semantic-model/program";
import {infer} from "../../lib/infer";
import {NumberType, StringType, BooleanType, NullType, VoidType, MaybeType} from "../../lib/semantic-model/types";

describe("Type Inference Integration Tests", function () {

	it("infers the types for declared variables correctly", function () {
		// act
		const sourceFile = inferTypes(`
		let age = 10;
		let born = true;
		let name = "test";
		let dateOfDeath = null;
		let hero;
		`);

		// assert
		const scope = sourceFile.scope;

		expect(scope.resolveSymbol("age").type).to.be.instanceOf(NumberType);
		expect(scope.resolveSymbol("born").type).to.be.instanceOf(BooleanType);
		expect(scope.resolveSymbol("name").type).to.be.instanceOf(StringType);
		expect(scope.resolveSymbol("dateOfDeath").type).to.be.instanceOf(NullType);
		expect(scope.resolveSymbol("hero").type).to.be.instanceOf(VoidType);
	});

	it("changes the type of a variable to Maybe<number> when it is initialized with null but later assigned a number", function () {
		// act
		const sourceFile = inferTypes(`
		let age = null;
		age = 10;
		`);

		// assert
		expect(sourceFile.scope.resolveSymbol("age").type).to.be.instanceOf(MaybeType);
	});

	it("the type of a function parameter can be inferred if it is used in a numeric calculation", function () {
		// act
		const sourceFile = inferTypes(`
		function test(x) {
			return x * 2;
		}
		`);

		// assert
		const functionNode = sourceFile.ast.program.body[0];
		const functionScope = functionNode.scope;

		expect(functionScope.resolveSymbol("x").type).to.be.instanceOf(MaybeType);
	});

	it("fails if a string is assigned to a number variable", function () {
		// arrange
		const source = `
		let x = 10;
		x = "test";
		`;

		// act, assert
		expect(() => inferTypes(source)).to.throw("Type inference failure: Unification for type 'number' and 'string' failed because there exists no rule that can be used to unify the given types.");
	});

    /**
     * Infers the types for the given code and returns the source file.
     * @param code the source code for which the types should be inferred.
     * @throws {TypeInferenceError} if a type cannot be unified with another (a type checker error)
     * @returns {SourceFile} the analysed source file
     */
	function inferTypes(code) {
		const program = new Program();
		const sourceFile = program.createSourceFile("./type-inference.integration-test.js", code);

		infer(sourceFile, program);

		return sourceFile;
	}
});
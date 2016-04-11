import {expect} from "chai";

import {Program} from "../../lib/semantic-model/program";
import {infer} from "../../lib/infer";
import {NumberType, StringType, BooleanType, NullType, VoidType, MaybeType, RecordType, FunctionType} from "../../lib/semantic-model/types";

describe("ForwardAnalysisTypeInference Integration Tests", function () {

	it("infers the types for declared variables correctly", function () {
		// act
		const { typeEnvironment, scope } = inferTypes(`
			let age = 10;
			let born = true;
			let name = "test";
			let dateOfDeath = null;
			let hero;
		`);

		// assert
		expect(typeEnvironment.getType(scope.resolveSymbol("age"))).to.be.instanceOf(NumberType);
		expect(typeEnvironment.getType(scope.resolveSymbol("born"))).to.be.instanceOf(BooleanType);
		expect(typeEnvironment.getType(scope.resolveSymbol("name"))).to.be.instanceOf(StringType);
		expect(typeEnvironment.getType(scope.resolveSymbol("dateOfDeath"))).to.be.instanceOf(NullType);
		expect(typeEnvironment.getType(scope.resolveSymbol("hero"))).to.be.instanceOf(VoidType);
	});

	it("changes the type of a variable to number when it is initialized with null but later assigned a number", function () {
		// act
		const {typeEnvironment, scope} = inferTypes(`
		let age = null;
		age = 10;
		`);

		// assert
		expect(typeEnvironment.getType(scope.resolveSymbol("age"))).to.be.instanceOf(NumberType);
	});

	it("the type of a function parameter can be inferred if the parameter is used in a numeric calculation", function () {
		// act
		const { typeEnvironment, ast } = inferTypes(`
		function test(x) {
			return x * 2;
		}
		`);

		// assert
		const functionNode = ast.program.body[0];
		const functionScope = functionNode.scope;

		expect(typeEnvironment.getType(functionScope.resolveSymbol("x"))).to.be.instanceOf(MaybeType).and.to.have.property("of").that.is.instanceOf(NumberType);
	});

	it("changes to aliased variables are not reflected to their aliases", function () {
		// act
		const {typeEnvironment, scope} = inferTypes(`
		let p1 = { name: "Micha", age: 26};
		let person = p1;
		person.address = { street: "Nice view 23" };
		`);

		// assert
		const person = scope.resolveSymbol("person");
		const p1 = scope.resolveSymbol("p1");
		const personType = typeEnvironment.getType(person);
		const p1Type = typeEnvironment.getType(p1);

		expect(personType).to.be.instanceOf(RecordType);
		expect(personType.hasProperty(p1.getMember("name"))).to.be.true;
		expect(personType.hasProperty(p1.getMember("age"))).to.be.true;
		expect(personType.hasProperty(person.getMember("address"))).to.be.true;
		expect(p1Type.hasProperty(person.getMember("address"))).to.be.false;

		const address = person.getMember("address");
		const addressType = typeEnvironment.getType(address);
		expect(addressType).to.be.instanceOf(RecordType);
		expect(addressType.hasProperty(address.getMember("street")));
	});

	it("refinements about the return type of a function are reflected in all references to that function", function () {
		// act
		const {typeEnvironment, ast, scope} = inferTypes(`
		function hy(x) {
			let func = hy;
			return z.name / 2 + x;
		}
		`);

		const blockScope = ast.program.body[0].body.scope;
		const hy = scope.resolveSymbol("hy");
		const hyType = typeEnvironment.getType(hy);
		const func = blockScope.resolveSymbol("func");
		const funcType = typeEnvironment.getType(func);

		// assert
		expect(hyType).to.be.instanceOf(FunctionType);
		expect(hyType.thisType).to.be.instanceOf(NullType);
		expect(hyType.params[0]).to.be.instanceOf(MaybeType).and.to.have.property("of").that.is.an.instanceOf(NumberType);
		expect(funcType.thisType).to.equal(hyType.thisType);
		expect(funcType.params).to.deep.equal(hyType.params);
		expect(funcType.returnType).to.equal(hyType.returnType);
	});

	it("it does not refine the type for identifiers used in calculations to not reduce the accuracy of their inferred type (x=null is here the most accurate information)", function () {
		// act

		const {typeEnvironment, scope} = inferTypes(`
		const x = null;
		const y = 2 * x;
		`);

		// assert
		const x = scope.resolveSymbol("x");
		const y = scope.resolveSymbol("y");

		expect(typeEnvironment.getType(x)).to.be.instanceOf(NullType);
		expect(typeEnvironment.getType(y)).to.be.instanceOf(NumberType);
	});

	it("refines the types between each cfg step", function () {
		// act
		const {scope, ast} = inferTypes(`
		let x = null;
		x = 15;
		`);

		// assert
		const typeEnv1 = ast.cfg.getNode(ast.program.body[0]).annotation.out;
		const typeEnv2 = ast.cfg.getNode(ast.program.body[1]).annotation.out;
		const x = scope.resolveSymbol("x");

		expect(typeEnv1.getType(x)).to.be.instanceOf(NullType);
		expect(typeEnv2.getType(x)).to.be.instanceOf(NumberType);
	});

    /**
     * Infers the types for the given code and returns the type environment, ast and the scope of the source file
     * @param code the source code for which the types should be inferred.
     * @throws {TypeInferenceError} if a type cannot be unified with another (a type checker error)
     * @returns {{typeEnvironment: TypeEnvironment, scope: Scope, ast: {}} the analysed source file
     */
	function inferTypes(code) {
		const program = new Program();
		const sourceFile = program.createSourceFile("./type-inference.integration-test.js", code);

		infer(sourceFile, program);

		const cfg = sourceFile.ast.cfg;
		return { typeEnvironment: cfg.getNode(null).annotation.out, scope: sourceFile.scope, ast: sourceFile.ast };
	}
});
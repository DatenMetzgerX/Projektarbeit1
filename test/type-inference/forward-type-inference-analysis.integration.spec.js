import {expect} from "chai";

import {Symbol} from "../../lib/semantic-model/symbol";
import {Program} from "../../lib/semantic-model/program";
import {infer} from "../../lib/infer";
import {NumberType, StringType, BooleanType, NullType, VoidType, MaybeType, RecordType} from "../../lib/semantic-model/types";

describe("ForwardTypeInferenceAnalysis Integration Tests", function () {

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

	it("infers the type from the result of a function call", function () {
		// act
		const { typeEnvironment, ast } = inferTypes(`
		function test(x) {
			return x * 2;
		}
		
		const l = test(10);
		`);

		// assert
		const functionNode = ast.program.body[0];
		const functionScope = functionNode.scope;

		expect(typeEnvironment.getType(functionScope.resolveSymbol("l"))).to.be.instanceOf(NumberType);
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
		const addressType = personType.getType(address);
		expect(addressType).to.be.instanceOf(RecordType);
		expect(addressType.hasProperty(address.getMember("street")));
	});

	it("adds added properties in a function call to the type in the callers context", function () {
		// act
		const {typeEnvironment, scope} = inferTypes(`
		function setName(x, name) {
			x.name = name;
		}
		
		let p = {};
		setName(p, "Test");
		`);

		const p = scope.resolveSymbol("p");
		const pType = typeEnvironment.getType(p);

		// assert
		expect(pType).to.be.instanceOf(RecordType);
		expect(pType.getType(new Symbol("name"))).to.be.instanceOf(StringType);
	});

	it("throws if a function access members of an object that is null or not defined", function () {
		expect(() => inferTypes(`
		function getStreet(x) {
			return x.address.street;
		}
		
		getStreet({});
		`)).to.throw("Type inference failure: Potential null pointer when accessing property street on null or not initialized object of type undefined.");
	});

	it("a member is void if it is accessed before it's declaration", function () {
		// act
		const {typeEnvironment, scope} = inferTypes(`
		function getName(x) {
			return x.name;
		}
		
		let name = getName({});
		`);

		const name = scope.resolveSymbol("name");

		// assert
		expect(typeEnvironment.getType(name)).to.be.instanceOf(VoidType);
	});

	it("supports functions as arguments", function () {
		// act
		const {typeEnvironment, scope} = inferTypes(`
		function id(x) {
			return x;
		}
		
		const ten = id(id)(10);
		`);

		const ten = scope.resolveSymbol("ten");

		// assert
		expect(typeEnvironment.getType(ten)).to.be.instanceOf(NumberType);
	});

	it("does not change the type of the callers argument when the function assigns to the parameters of the function", function () {
		// act
		const {typeEnvironment, scope} = inferTypes(`
		function toNumber(x) {
			x = 10;
			return x;
		}
		
		let input = "10";
		toNumber(input);
		`);

		const ten = scope.resolveSymbol("input");

		// assert
		expect(typeEnvironment.getType(ten)).to.be.instanceOf(StringType);
	});

	it("throws an error if a not declared identifier is passed to a function call", function () {
		expect(() => inferTypes(`
		function toNumber(x) {
			x = 10;
			return x;
		}
		
		toNumber(x);
		`)).to.throw("Type inference failure: The identifier x is not defined");
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

	it("merges the type definitions from different branches", function () {
		// act
		const {typeEnvironment, scope} = inferTypes(`
			let p1 = { name: null, age: null};
			
			if (!p1.name) {
				p1.name = "Default";
			}
		`);

		// assert
		const p1 = scope.resolveSymbol("p1");
		const p1Record = typeEnvironment.getType(p1);
		expect(p1Record.getType(p1.getMember("name"))).to.be.instanceOf(MaybeType).and.to.have.property("of").that.is.an.instanceOf(StringType);
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

	it("can infer the type of recursive functions", function () {
		// act
		const {scope, typeEnvironment} = inferTypes(`
		function successor(x) {
			if (x === 0) {
				return 1;
			}
		
			return successor(x - 1) + 1;
		}
		let eleven = successor(10000);
		`);

		// assert
		const eleven = scope.resolveSymbol("eleven");

		expect(typeEnvironment.getType(eleven)).to.be.instanceOf(NumberType);
	});

	it("can invoke built in function types", function() {
		// act
		const {scope, typeEnvironment} = inferTypes("const uppercase = 'Micha Reiser'.toUpperCase();");

		// assert
		const uppercase = scope.resolveSymbol("uppercase");
		expect(typeEnvironment.getType(uppercase)).to.be.instanceOf(StringType);
	});

	it("throws if a required argument is missing when calling a built in function", function () {
		expect(() => inferTypes("'Micha Reiser'.substring();")).to.throw("Type inference failure: The argument 1 with type \'undefined\' is not a subtype of the required parameter type \'number\'.");
	});

	it("throws if an argument of a built in function is not a subtype of the parameter type", function () {
		expect(() => inferTypes("'Micha Reiser'.substring('3');")).to.throw("Type inference failure: The argument 1 with type \'string\' is not a subtype of the required parameter type \'number\'.");
	});

	it("a built in function with optional parameters can be invoked", function () {
		// act
		const {scope, typeEnvironment} = inferTypes("const substr = 'Micha Reiser'.substring(4);");

		// assert
		const substring = scope.resolveSymbol("substr");
		expect(typeEnvironment.getType(substring)).to.be.instanceOf(StringType);
	});

	it("throws if a built in function is called where the this type is not a subtype of the required this type", function () {
		expect(() => inferTypes(`
			const substr = "".substr;
			substr(3);
		`)).to.throw("Type inference failure: The function cannot be called with this of type 'undefined' whereas 'string' is required.");
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
		return { typeEnvironment: cfg.getNode(null).annotation.in, scope: sourceFile.scope, ast: sourceFile.ast };
	}
});
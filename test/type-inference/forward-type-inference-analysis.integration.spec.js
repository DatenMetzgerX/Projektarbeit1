import {expect} from "chai";

import {Symbol} from "../../lib/semantic-model/symbol";
import {Program} from "../../lib/semantic-model/program";
import {TypeEnvironment} from "../../lib/type-inference/type-environment";
import {infer} from "../../lib/infer";
import {NumberType, StringType, BooleanType, NullType, VoidType, MaybeType, RecordType, ArrayType, AnyType, ObjectType} from "../../lib/semantic-model/types";

describe("ForwardTypeInferenceAnalysis Integration Tests", function () {

	it("can analyse an empty program", function () {
		expect(() => inferTypes("// alert('Hello world!');")).not.to.throw();
	});

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

	it("throws an error if a not declared identifier is passed to a function call", function () {
		expect(() => inferTypes(`
		function toNumber(x) {
			x = 10;
			return x;
		}
		
		toNumber(x);
		`)).to.throw("Type inference failure: The symbol x is being used before it's declaration");
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
		const {scope, ast, typeEnvironments} = inferTypes(`
		let x = null;
		x = 15;
		`);

		// assert
		const typeEnv1 = typeEnvironments.get(ast.program.body[0]);
		const typeEnv2 = typeEnvironments.get(ast.program.body[1]);
		const x = scope.resolveSymbol("x");

		expect(typeEnv1.getType(x)).to.be.instanceOf(NullType);
		expect(typeEnv2.getType(x)).to.be.instanceOf(NumberType);
	});

	describe("members", function () {
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

		it("returns type any for computed properties", function () {
			// act
			const {typeEnvironment, scope} = inferTypes(`
			let keys = []; // e.g. Object.keys
			let o = {};
			const v = o[keys[0]];
			`);

			const v = scope.resolveSymbol("v");

			// assert
			expect(typeEnvironment.getType(v)).to.be.instanceOf(AnyType);
		});

		it("returns type any for a member access on a computed property", function () {
			// act
			const {typeEnvironment, scope} = inferTypes(`
			let keys = []; // e.g. Object.keys
			let o = {};
			const v = o[keys[i]].length;
			`);

			const v = scope.resolveSymbol("v");

			// assert
			expect(typeEnvironment.getType(v)).to.be.instanceOf(AnyType);
		});

		it("allows assignment to a computed property", function () {
			// act
			const {typeEnvironment, scope} = inferTypes(`
			let keys = ['name']; // e.g. Object.keys
			let o = {};
			o[keys[0]] = "test";
			const name = o.name;
			`);

			const name = scope.resolveSymbol("name");

			// assert
			expect(typeEnvironment.getType(name)).to.be.instanceOf(VoidType);
		});
	});

	describe("function call", function () {
		it("a built in function with optional parameters can be invoked", function () {
			// act
			const {scope, typeEnvironment} = inferTypes("const substr = 'Micha Reiser'.substring(4);");

			// assert
			const substring = scope.resolveSymbol("substr");
			expect(typeEnvironment.getType(substring)).to.be.instanceOf(StringType);
		});

		it("resolves a type variable from the outer context", function () {
			// act
			const {scope, typeEnvironment } = inferTypes(`
				let x;
				
				function a() {
					x = 10;
				}
				a();
				const b = x;
			`);

			// assert
			const b = scope.resolveSymbol("b");
			expect(typeEnvironment.getType(b)).to.be.an.instanceOf(NumberType);
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

		it("does not update the type of the callers argument when the function reassigns the variable", function () {
			// act
			const {typeEnvironment, scope} = inferTypes(`
			function defaults(options) {
				options = { test: true };
				return options;
			}
			
			let calculationOptions = { nullAsZero: true }
			defaults(calculationOptions);
			`);

			const calculationOptions = scope.resolveSymbol("calculationOptions");

			// assert
			const type = typeEnvironment.getType(calculationOptions);
			expect(type).to.be.instanceOf(ObjectType);
			expect(type.hasProperty(new Symbol("test"))).to.be.false;
			expect(type.hasProperty(new Symbol("nullAsZero"))).to.be.true;
		});

		it("throws if a built in function is called where the this type is not a subtype of the required this type", function () {
			expect(() => inferTypes(`
				const substr = "".substr;
				substr(3);
			`)).to.throw("Type inference failure: The function cannot be called with this of type 'undefined' whereas 'string' is required.");
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

		it("supports closures", function () {
			const {scope, typeEnvironment} = inferTypes(`
			const result = [];
			function filter(i) {
				if (i % 2 === 0) {
					result.push(i);
				}
			}
			
			let i = 0;
			while (i < 10) {
				filter(i++);
			}
			`);

			// assert
			const result = scope.resolveSymbol("result");

			expect(typeEnvironment.getType(result)).to.be.instanceOf(ArrayType).and.has.property("of").that.is.an.instanceOf(NumberType);
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

		it("infers the correct return type for a function that calls a function in a loop", function() {
			// act
			const {scope, typeEnvironment} = inferTypes(`
			function compute() {
				for (let i = 0; i < 10; ++i) {
					(function () { return i % 2 === 0; })();
				}
				return "done";
			}
			
			const result = compute(); 
			`);

			// assert
			const result = scope.resolveSymbol("result");
			expect(typeEnvironment.getType(result)).to.be.instanceOf(StringType);
		});

		it("throws if a required argument is missing when calling a built in function", function () {
			expect(() => inferTypes("'Micha Reiser'.substring();")).to.throw("Type inference failure: The argument 1 with type \'undefined\' is not a subtype of the required parameter type \'number\'.");
		});

		it("throws if an argument of a built in function is not a subtype of the parameter type", function () {
			expect(() => inferTypes("'Micha Reiser'.substring('3');")).to.throw("Type inference failure: Unification for type \'string\' and \'number\' failed because there exists no rule that can be used to unify the given types.");
		});

		it("can invoke functions of built in objects", function () {
			expect(() => inferTypes("console.log('x');")).not.to.throw();
		});
	});

	describe("array", function () {
		it("infers the type of an array", function () {
			// act
			const {scope, typeEnvironment} = inferTypes("const numbers = [3, 4, 5, 6]");

			// assert
			const numbers = scope.resolveSymbol("numbers");
			const numbersType = typeEnvironment.getType(numbers);

			expect(numbersType).to.be.instanceOf(ArrayType);
			expect(numbersType).to.have.property("of").that.is.an.instanceOf(NumberType);
		});

		it("an array is of type any if the elements have no other common type", function () {
			// act
			const {scope, typeEnvironment} = inferTypes("const numbers = [3, 'four', 5, 'six']");

			// assert
			const numbers = scope.resolveSymbol("numbers");
			const numbersType = typeEnvironment.getType(numbers);

			expect(numbersType).to.be.instanceOf(ArrayType);
			expect(numbersType).to.have.property("of").that.is.an.instanceOf(AnyType);
		});

		it("infers the type of an array to the most common subtype", function () {
			// act
			const {scope, typeEnvironment} = inferTypes(`
			const p1 = {name: 'Test' };
			const p2 = {name: 'Test2', street: '...'};
			const p3 = {name: 'Test3', age: 12};
			const persons = [p1, p2, p3];
			`);

			// assert
			const persons = scope.resolveSymbol("persons");
			const personsType = typeEnvironment.getType(persons);

			expect(personsType).to.be.instanceOf(ArrayType);
			expect(personsType).to.have.property("of").that.is.an.instanceOf(ObjectType);
			expect(personsType.of.getType(new Symbol("name"))).to.be.instanceOf(StringType);
			expect(personsType.of.getType(new Symbol("street"))).to.be.undefined;
			expect(personsType.of.getType(new Symbol("age"))).to.be.undefined;
		});

		it("can access array elements", function () {
			// act
			const {scope, typeEnvironment} = inferTypes(`
			const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
			const two = numbers[1];
			numbers[1] = 4;
			`);

			// assert
			const two = scope.resolveSymbol("two");

			expect(typeEnvironment.getType(two)).to.be.instanceOf(NumberType);
		});

		it("can assign values to an array element", function () {
			const {scope, typeEnvironment} = inferTypes(`
			const numbers = [];
			numbers[0] = 4;
			`);

			// assert
			const numbers = scope.resolveSymbol("numbers");

			expect(typeEnvironment.getType(numbers)).to.be.instanceOf(ArrayType).and.has.property("of").that.is.an.instanceOf(NumberType);
		});

		it("can add values to an array", function () {
			const {scope, typeEnvironment} = inferTypes(`
			const numbers = [];
			numbers.push(3);
			`);

			// assert
			const numbers = scope.resolveSymbol("numbers");

			expect(typeEnvironment.getType(numbers)).to.be.instanceOf(ArrayType).and.has.property("of").that.is.an.instanceOf(NumberType);
		});

		it("can invoke array methods", function () {
			const {scope, typeEnvironment} = inferTypes(`
			const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
			const even = numbers.filter(function (n) { return n % 2 == 0; });
			const mapped = numbers.map(function (n) { return [n]; });
			const summed = numbers.reduce(function (current, n) { return current + n; }, 0); 
			`);

			// assert
			const even = scope.resolveSymbol("even");
			const mapped = scope.resolveSymbol("mapped");
			const sum = scope.resolveSymbol("summed");

			expect(typeEnvironment.getType(even)).to.be.instanceOf(ArrayType).and.has.property("of").that.is.an.instanceOf(NumberType);
			expect(typeEnvironment.getType(mapped)).to.be.instanceOf(ArrayType).and.has.property("of").that.is.an.instanceOf(ArrayType);
			expect(typeEnvironment.getType(sum)).to.be.instanceOf(NumberType);
		});
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

		const typeEnvironments = infer(sourceFile, program);
		const typeEnv = typeEnvironments.get(null) || TypeEnvironment.EMPTY;
		return { typeEnvironment: typeEnv, scope: sourceFile.scope, ast: sourceFile.ast, typeEnvironments: typeEnvironments };
	}
});
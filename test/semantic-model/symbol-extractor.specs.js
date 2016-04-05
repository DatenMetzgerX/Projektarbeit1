import {expect} from "chai";
import traverse from "babel-traverse";
import {parse} from "babylon";

import {SymbolFlags} from "../../lib/semantic-model/symbol";
import {SymbolExtractor} from "../../lib/semantic-model/symbol-extractor";
import {Program} from "../../lib/semantic-model/program";

describe("SymbolExtractor", function () {
	let program;

	beforeEach(function () {
		program = new Program();
	});

	describe("Block", function () {
		it("assigns the scope to the node's scope property", function () {
			// act
			const ast = extractSymbols("let x");

			// assert
			expect(ast.program.scope).not.to.be.undefined;
		});

		it("creates a new scope for a new block", function () {
			// act
			const ast = extractSymbols(`
				{
					let z = 10;
				}
			`);

			// assert
			const programScope = ast.program.scope;
			const blockScope = ast.program.body[0].scope;

			expect(blockScope).not.to.be.undefined.and.not.to.equal(programScope);
		});
	});

	describe("VariableDeclarator", function () {
		it("creates a symbol in the current scope for a declared variable", function () {
			// act
			const ast = extractSymbols("let x = 10");

			// assert
			const scope = ast.program.scope;
			expect(scope.resolveSymbol("x")).to.have.property("name").that.equals("x");
		});

		it("sets the declarator node as declaration of the symbol", function () {
			// act
			const ast = extractSymbols("let x = 10");

			// assert
			const scope = ast.program.scope;
			expect(scope.resolveSymbol("x")).to.have.property("declaration").that.equals(ast.program.body[0].declarations[0]);
		});

		it("sets the value declaration of the symbol if the value is initialized in the declarator", function () {
			// act
			const ast = extractSymbols("let x = 10");

			// assert
			const scope = ast.program.scope;
			expect(scope.resolveSymbol("x")).to.have.property("valueDeclaration").that.equals(ast.program.body[0].declarations[0].init);
		});
	});

	describe("AssignmentExpression", function () {
		it("adds a member to the symbol to which the member is assigned for a member assignment expression", function () {
			// act
			const ast = extractSymbols(`
				let x = 12;
				x.y = 12;
			`);

			// assert
			const x = ast.program.scope.resolveSymbol("x");
			const y = x.getMember("y");

			expect(y).to.have.property("name").that.equals("y");
		});

		it("adds a member to the symbol of the nearest parent symbol for an assignment expression", function () {
			// act
			const ast = extractSymbols(`
				let x = {};
				x.y = {};
				x.y.z = 10;
			`);

			// assert
			const x = ast.program.scope.resolveSymbol("x");
			const y = x.getMember("y");
			const z = y.getMember("z");

			expect(z).to.have.property("name").that.equals("z");
		});

		it("adds unknown intermediate members", function () {
			// act
			const ast = extractSymbols(`
				let x = {};
				x.y.z = 10;
			`);

			// assert
			const x = ast.program.scope.resolveSymbol("x");
			const y = x.getMember("y");
			const z = y.getMember("z");

			expect(z).to.have.property("name").that.equals("z");
		});

		it("can handle access to not yet declared identifiers", function () {
			// act
			const ast = extractSymbols(`
				x.y = 10;
				var x;
			`);

			// assert
			const x = ast.program.scope.resolveSymbol("x");
			const y = x.getMember("y");

			expect(y).to.have.property("name").that.equals("y");
		});

		it("creates a symbol for assigned variables", function () {
			// act
			const ast = extractSymbols(`
				x = 10;
			`);

			// assert
			const x = ast.program.scope.resolveSymbol("x");

			expect(x).to.have.property("name").that.equals("x");
			expect(x).to.have.property("declaration").that.is.null;
		});
	});

	describe("FunctionExpression", function () {
		it("creates a new scope", function () {
			// act
			const ast = extractSymbols(`
			function dump(count) {
				console.log(count);
			}
			`);

			// assert
			expect(ast.program.body[0].scope).to.be.ok;
		});

		it("creates a symbol for each parameter", function () {
			// act
			const ast = extractSymbols(`
			function dump(count) {
				console.log(count);
			}
			`);

			// assert
			const x = ast.program.body[0].scope.resolveSymbol("count");

			expect(ast.program.body[0].scope.hasOwnSymbol("count")).to.be.true;
			expect(x).to.have.property("name").that.equals("count");
			expect(x).to.have.property("declaration").that.is.equal(ast.program.body[0]);
		});

		it("does not create a symbol for the parameters in the outer scope", function () {
			// act
			const ast = extractSymbols(`
			function dump(count) {
				console.log(count);
			}
			`);

			// assert
			expect(ast.program.scope.hasOwnSymbol("count")).to.be.false;
		});

		it("creates a symbol for the function", function () {
			// act
			const ast = extractSymbols(`
			function dump(count) {
				console.log(count);
			}
			`);

			// assert
			const dump = ast.program.scope.resolveSymbol("dump");
			expect(ast.program.scope.hasOwnSymbol("dump")).to.be.true;
			expect(dump).to.have.property("name").that.equals("dump");
			expect(dump).to.have.property("declaration").that.equals(ast.program.body[0]);
		});

		it("does not create a symbol for the function in the function scope", function () {
			// act
			const ast = extractSymbols(`
			function dump(count) {
				console.log(count);
			}
			`);

			// assert
			expect(ast.program.body[0].scope.hasOwnSymbol("dump")).to.be.false;
		});
	});

	describe("ObjectExpression", function () {
		const code = `let micha = {
			name: "Micha",
			lastName: "Reiser",
			age: 26,
			fullName() {
				return \`${this.name} ${this.lastName}\`;
			}
		};`;

		it("creates a symbol for the object", function () {
			// act
			const ast = extractSymbols(code);

			// assert
			expect(ast.program.scope.hasOwnSymbol("micha")).to.be.true;
		});

		it("creates a member for each object property", function () {
			// act
			const ast = extractSymbols(code);

			// assert
			const object = ast.program.scope.resolveSymbol("micha");
			expect(object.getMember("name")).to.have.property("flags", SymbolFlags.Property);
			expect(object.getMember("age")).to.have.property("flags", SymbolFlags.Property);
			expect(object.getMember("fullName")).to.have.property("flags", SymbolFlags.Property);
		});

		it("supports nested objects", function () {
			// act
			const ast = extractSymbols(`let micha = {
				name: "Micha",
				lastName: "Reiser",
				age: 26,
				address: {
					street: "XY"
				}
			};`);

			// assert
			const object = ast.program.scope.resolveSymbol("micha");
			const address = object.getMember("address");
			expect(address).not.to.be.undefined;
			expect(address.getMember("street")).to.have.property("flags", SymbolFlags.Property);
		});
	});

	function extractSymbols(source) {
		const ast = parse(source);

		const symbolExtractor = new SymbolExtractor(program);
		traverse(ast, symbolExtractor.visitor, null, symbolExtractor.state);
		return ast;
	}
});
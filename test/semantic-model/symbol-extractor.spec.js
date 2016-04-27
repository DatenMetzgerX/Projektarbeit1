import {expect, Assertion} from "chai";
import traverse from "babel-traverse";
import {parse} from "babylon";

import {SymbolFlags, Symbol} from "../../lib/semantic-model/symbol";
import {SymbolExtractor} from "../../lib/semantic-model/symbol-extractor";
import {Program} from "../../lib/semantic-model/program";
import {createTraverseVisitorWrapper} from "../../lib/util";
import {Scope} from "../../lib/semantic-model/scope";

describe("SymbolExtractor", function () {
	let program;

	beforeEach(function () {
		program = new Program();
	});

	describe("Program", function () {
		it("assigns the global scope to the program statement", function () {
			// act
			const ast = extractSymbols("let x");

			// assert
			expect(ast.program.scope).to.equal(program.globalScope);
		});
	});

	describe("Statements", function () {
		describe("EmptyStatement", function () {
			it("supports empty statements", function () {
				// act, assert
				expect(() => extractSymbols(";")).not.to.throw();
			});
		});

		describe("BlockStatement", function () {
			it("creates a new scope and assigns it to the node", function () {
				// act
				const ast = extractSymbols(`
				{
					let x = 10;
				}
				`);

				// assert
				expect(ast.program.body[0].scope).to.be.instanceOf(Scope);
				expect(ast.program.body[0].scope).not.to.equal(program.globalScope);
			});

			it("leaves the child scope after visiting the block statement", function () {
				// act
				const ast = extractSymbols(`
				{
				}
				let x = 10;
				`);

				// assert
				expect(ast.program.body[0].scope).not.to.have.ownSymbol("x");
				expect(program.globalScope).to.have.ownSymbol("x");
			});
		});

		describe("ExpressionStatement", function () {
			it("registers identifiers directly used inside the expression of an expression statement in the scope", function () {
				// act
				const ast = extractSymbols("x");

				// assert
				const scope = ast.program.scope;
				expect(scope).to.have.ownSymbol("x");
			});

			it("assigns the symbol with the identifier node for identifiers directly used inside of an expression statement", function () {
				// act
				const ast = extractSymbols("x");

				// assert
				expect(program.symbolTable.getSymbol(ast.program.body[0].expression)).not.to.be.undefined;
			});
		});

		describe("IfStatement", function () {
			it("registers the identifiers used in the test expression of the if statement in the current scope", function () {
				// act
				const ast = extractSymbols("if (x) {}");

				// assert
				const scope = ast.program.scope;
				expect(scope).to.have.ownSymbol("x");
			});

			it("assigns the symbol to the identifier node in the test expression", function () {
				// act
				const ast = extractSymbols("if (x) {}");

				// assert
				expect(program.symbolTable.getSymbol(ast.program.body[0].test)).not.to.be.undefined;
			});
		});

		describe("LabeledStatement", function () {
			it("is supported", function () {
				// act, assert
				expect(() => extractSymbols("x: y;")).not.to.throw();
			});
		});

		describe("BreakStatement", function () {
			it("is supported", function () {
				// act, assert
				expect(() => extractSymbols(`
				for (let x = 0; x < 1; x++) {
					break;
				}
			`)).not.to.throw();
			});
		});

		describe("ContinueStatement", function () {
			it("is supported", function () {
				// act, assert
				expect(() => extractSymbols(`
				for (let x = 0; x < 1; x++) {
					continue;
				}
				`)).not.to.throw();
			});
		});

		describe("SwitchStatement", function () {
			it("registers the identifiers in the discriminant expression", function () {
				// act
				const ast = extractSymbols("switch (x) {}");

				// assert
				const scope = ast.program.scope;
				expect(scope).to.have.ownSymbol("x");
				expect(program.symbolTable.getSymbol(ast.program.body[0].discriminant)).not.to.be.undefined;
			});
		});

		describe("ReturnStatement", function () {
			it("adds an identifier used in the return statement to the current scope", function () {
				// act
				const ast = extractSymbols("function x() { return y; }");

				// assert
				const scope = ast.program.body[0].body.scope;
				expect(scope).to.have.ownSymbol("y");
			});

			it("assigns the symbol to the identifier used directly in the return statement", function () {
				// act
				const ast = extractSymbols("function x() { return y; }");

				// assert
				expect(program.symbolTable.getSymbol(ast.program.body[0].body.body[0].argument)).not.to.be.undefined;
			});
		});

		describe("ThrowStatement", function () {
			it("registers the identifiers in the argument expression", function () {
				// act
				const ast = extractSymbols("throw x");

				// assert
				const scope = ast.program.scope;
				expect(scope).to.have.ownSymbol("x");
				expect(program.symbolTable.getSymbol(ast.program.body[0].argument)).not.to.be.undefined;
			});
		});

		describe("TryStatement", function () {
			it("is supported", function () {
				// act, assert
				expect(() => extractSymbols(`
				try {} finally {}
				`)).not.to.throw();
			});
		});

		describe("WhileStatement", function () {
			it("registers the identifiers in the test expression", function () {
				// act
				const ast = extractSymbols("while(x) {}");

				// assert
				const scope = ast.program.scope;
				expect(scope).to.have.ownSymbol("x");
				expect(program.symbolTable.getSymbol(ast.program.body[0].test)).not.to.be.undefined;
			});
		});

		describe("ForStatement", function () {
			it("adds identifiers used in the init, test or update expression to the current scope", function () {
				// act
				extractSymbols("for (x;y;z) {}");

				// assert
				expect(program.globalScope).to.have.ownSymbol("x");
				expect(program.globalScope).to.have.ownSymbol("y");
				expect(program.globalScope).to.have.ownSymbol("z");
			});

			it("assigns the symbols with the identifiers used in the init, test or update expression", function () {
				// act
				const ast = extractSymbols("for (x;y;z) {}");

				// assert
				const forStatement = ast.program.body[0];
				expect(program.symbolTable.getSymbol(forStatement.init)).to.be.defined;
				expect(program.symbolTable.getSymbol(forStatement.test)).to.be.defined;
				expect(program.symbolTable.getSymbol(forStatement.update)).to.be.defined;
			});
		});

		describe("ForInStatement", function () {
			it("registers the identifiers in the left hand side expression", function () {
				// act
				const ast = extractSymbols("for (x in y) {}");

				// assert
				const scope = ast.program.scope;
				expect(scope).to.have.ownSymbol("x");
				expect(program.symbolTable.getSymbol(ast.program.body[0].left)).not.to.be.undefined;
			});

			it("registers the identifiers in the right hand side expression", function () {
				// act
				const ast = extractSymbols("for (x in y) {}");

				// assert
				const scope = ast.program.scope;
				expect(scope).to.have.ownSymbol("y");
				expect(program.symbolTable.getSymbol(ast.program.body[0].right)).not.to.be.undefined;
			});
		});

		describe("ForOfStatement", function () {
			it("registers the identifiers in the left hand side expression", function () {
				// act
				const ast = extractSymbols("for (x of y) {}");

				// assert
				const scope = ast.program.scope;
				expect(scope).to.have.ownSymbol("x");
				expect(program.symbolTable.getSymbol(ast.program.body[0].left)).not.to.be.undefined;
			});

			it("registers the identifiers in the right hand side expression", function () {
				// act
				const ast = extractSymbols("for (const x of y) {}");

				// assert
				const scope = ast.program.scope;
				expect(scope).to.have.ownSymbol("y");
				expect(program.symbolTable.getSymbol(ast.program.body[0].right)).not.to.be.undefined;
			});
		});
	});

	describe("Expressions", function () {

		describe("ThisExpression", function () {
			it("creates a new symbol for the first usage of this in a function", function () {
				// act
				const ast = extractSymbols(`
				function add(x) {
					this.sum += x;
				}
				`);

				// assert
				const func = ast.program.body[0];
				const scope = func.scope;

				expect(scope).to.have.ownSymbol("this");

				const thisExpression = func.body.body[0].expression.left.object;
				expect(program.symbolTable.getSymbol(thisExpression)).not.to.be.undefined;
			});

			it("reuses the previously defined this symbol", function () {
				// act
				const ast = extractSymbols(`
				function add(x) {
					this.sum += x;
					return this.sum;
				}
				`);

				// assert
				const func = ast.program.body[0];
				const scope = func.scope;

				expect(scope).to.have.ownSymbol("this");

				const firstThis = func.body.body[0].expression.left.object;
				const secondThis = func.body.body[1].argument.object;
				expect(program.symbolTable.getSymbol(secondThis)).to.equal(program.symbolTable.getSymbol(firstThis));
			});

			it("resolves the this from the function scope and not from the current scope", function () {
				// act
				const ast = extractSymbols(`
				function add(x) {
					this.sum += x;
					{
						return this.sum;
					}
				}
				`);

				// assert
				const func = ast.program.body[0];
				const scope = func.scope;

				expect(scope).to.have.ownSymbol("this");

				const firstThis = func.body.body[0].expression.left.object;
				const subBlock = func.body.body[1];
				const secondThis = subBlock.body[0].argument.object;

				expect(subBlock.scope).not.to.have.ownSymbol("this");
				expect(program.symbolTable.getSymbol(secondThis)).to.equal(program.symbolTable.getSymbol(firstThis));
			});

			it("does not throw if this is used outside a function declaration", function () {
				// act
				const ast = extractSymbols(`
					this.name;
				`);

				// assert
				const expression = ast.program.body[0].expression;
				const thisStatement = expression.object;
				const scope = ast.program.scope;

				expect(scope).to.have.ownSymbol("this");
				expect(program.symbolTable.getSymbol(thisStatement)).not.to.be.undefined;
			});
		});

		describe("ArrayExpression", function () {
			it("sets the symbols for identifiers used in the array", function () {
				const ast = extractSymbols("[p1, p2, 10]");

				expect(ast.program.scope).to.have.ownSymbol("p1");
				expect(ast.program.scope).to.have.ownSymbol("p2");

				const arrayExpression = ast.program.body[0].expression;
				expect(program.symbolTable.getSymbol(arrayExpression.elements[0])).not.to.be.undefined;
				expect(program.symbolTable.getSymbol(arrayExpression.elements[1])).not.to.be.undefined;
			});
		});

		describe("FunctionExpression", function () {
			it("creates a new child scope and assigns it to the function node", function () {
				// act
				const ast = extractSymbols(`
				function dump(count) {
					logger.log(count);
				}
				`);

				// assert
				expect(ast.program.body[0].scope).to.be.ok;
				expect(ast.program.body[0].scope).not.to.equal(program.globalScope);
			});

			it("leaves the child scope after the function declaration", function () {
				// act
				const ast = extractSymbols(`
				function dump(count) {
					logger.log(count);
				}
				let x = 10;
				`);

				// assert
				expect(ast.program.scope).to.have.ownSymbol("x");
			});

			it("creates a symbol for each parameter in the scope of the function", function () {
				// act
				const ast = extractSymbols(`
				function dump(current, intend) {
					logger.log(count);
				}
				`);

				// assert
				const scope = ast.program.body[0].scope;

				expect(scope).to.have.ownSymbol("current");
				expect(scope).to.have.ownSymbol("intend");
			});

			it("sets the declaration for a parameter symbol to the identifier node of the parameter", function () {
				// act
				const ast = extractSymbols(`
				function dump(current, intend) {
					logger.log(count);
				}
				`);

				// assert
				const scope = ast.program.body[0].scope;

				expect(scope.getOwnSymbol("current")).to.have.property("declaration", ast.program.body[0].params[0]);
			});

			it("sets the flags for the parameter to Variable", function () {
				// act
				const ast = extractSymbols(`
				function dump(current, intend) {
					logger.log(count);
				}
				`);

				// assert
				const scope = ast.program.body[0].scope;

				expect(scope.getOwnSymbol("current")).to.have.property("flags", SymbolFlags.Variable);
			});

			it("does not create a symbol for the parameters in the outer scope", function () {
				// act
				const ast = extractSymbols(`
				function dump(count) {
					logger.log(count);
				}
				`);

				// assert
				expect(ast.program.scope).not.to.have.ownSymbol("count");
			});

			it("creates a symbol for the function in the outer scope", function () {
				// act
				const ast = extractSymbols(`
				function dump(count) {
					logger.log(count);
				}
				`);

				// assert
				expect(ast.program.scope).to.have.ownSymbol("dump");
			});

			it("sets the declaration of the function symbol to the FunctionDeclaration node", function () {
				// act
				const ast = extractSymbols(`
				function dump(count) {
					logger.log(count);
				}
				`);

				// assert
				expect(ast.program.scope.getOwnSymbol("dump")).to.have.property("declaration", ast.program.body[0]);
			});

			it("sets the Function flag for the FunctionDeclaration", function () {
				// act
				const ast = extractSymbols(`
				function dump(count) {
					logger.log(count);
				}
				`);

				// assert
				expect(ast.program.scope.getOwnSymbol("dump")).to.have.property("flags", SymbolFlags.Function);
			});

			it("does not create a symbol for the function in the function scope", function () {
				// act
				const ast = extractSymbols(`
				function dump(count) {
					logger.log(count);
				}
				`);

				// assert
				expect(ast.program.body[0].scope).not.to.have.ownSymbol("dump");
			});

			it("handles the scopes correctly", function () {
				// act
				const ast = extractSymbols(`
				const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
				const even = numbers.filter(function isEven(n) { return n % 2 == 0; });
				const mapped = numbers.map(function toArray(n) { return [n]; });
				`);

				// assert
				expect(ast.program.scope).to.have.ownSymbol("numbers");
				expect(ast.program.scope).to.have.ownSymbol("even");
				expect(ast.program.scope).to.have.ownSymbol("mapped");
			});

			it("sets the symbol for anonymous function", function () {
				// act
				const ast = extractSymbols(`
				(function (count) {
					logger.log(count);
				})
				`);

				// assert
				expect(program.symbolTable.getSymbol(ast.program.body[0].expression)).not.to.be.undefined;
			});

			it("sets the symbolf or arrow functions", function () {
				// act
				const ast = extractSymbols(`
				x = n => n;
				`);

				// assert
				expect(program.symbolTable.getSymbol(ast.program.body[0].expression.right)).not.to.be.undefined;
			});
		});

		describe("VariableDeclarator", function () {
			it("creates a variable symbol in the current scope", function () {
				// act
				const ast = extractSymbols("let x = 10");

				// assert
				const scope = ast.program.scope;
				expect(scope).to.have.ownSymbol("x");
				expect(scope.getOwnSymbol("x")).to.have.property("flags", SymbolFlags.Variable);
			});

			it("sets the declarator node as declaration of the symbol", function () {
				// act
				const ast = extractSymbols("let x = 10");

				// assert
				const scope = ast.program.scope;
				expect(scope.getOwnSymbol("x")).to.have.property("declaration", ast.program.body[0].declarations[0]);
			});

			it("sets the valueDeclaration of the symbol the the valueDeclarator.init flag, if present", function () {
				// act
				const ast = extractSymbols("let x = 10");

				// assert
				const scope = ast.program.scope;
				expect(scope.getOwnSymbol("x")).to.have.property("valueDeclaration", ast.program.body[0].declarations[0].init);
			});

			it("uses the same symbol as identifiers used before with the same name", function () {
				// act
				const ast = extractSymbols("x = 5; let x = 10;");

				// assert
				expect(program.symbolTable.getSymbol(ast.program.body[0])).to.equal(program.symbolTable.getSymbol(ast.program.body[1]));
			});

			it("creates a symbol for identifiers used in the init expression", function () {
				// act
				const ast = extractSymbols("let x = y;");

				// assert
				expect(ast.program.scope).to.have.ownSymbol("y");
			});

			it("associates the symbol with the identifier node used in the init expression", function () {
				// act
				const ast = extractSymbols("let x = y;");

				// assert
				expect(program.symbolTable.getSymbol(ast.program.body[0].declarations[0].init)).to.have.property("flags", SymbolFlags.Variable);
			});
		});

		describe("ArrayExpression", function () {
			it("sets the symbols for identifiers used in the array expression", function () {
				const ast = extractSymbols("let persons = [ p1, p2 ];");

				expect(ast.program.scope).to.have.ownSymbol("p1");
				expect(ast.program.scope).to.have.ownSymbol("p2");
			});
		});

		describe("ObjectExpression", function () {
			it("sets the symbol of the object expression node to the symbol of the variable declaration when the object is directly assigned in a variable declarator", function () {
				// act
				const ast = extractSymbols("let person = { name: 'Micha' };");

				// assert
				const variableDeclarator = ast.program.body[0].declarations[0];
				const personSymbol = program.symbolTable.getSymbol(variableDeclarator.id);
				const objectSymbol = program.symbolTable.getSymbol(variableDeclarator.init);

				expect(objectSymbol).to.be.defined;
				expect(objectSymbol).to.equal(personSymbol);
			});

			it("sets the symbol of the object expression node to the symbol of the assignee of an assignment expression when the object is assigned in an assignment expression", function () {
				const ast = extractSymbols("person = { name: 'Micha' };");

				// assert
				const assignmentExpression= ast.program.body[0].expression;
				const personSymbol = program.symbolTable.getSymbol(assignmentExpression.left);
				const objectSymbol = program.symbolTable.getSymbol(assignmentExpression.right);

				expect(objectSymbol).to.be.defined;
				expect(objectSymbol).to.equal(personSymbol);
			});

			it("sets the symbol of the object expression to the member id to which it is assigned if the object expression is used in an object property", function () {
				const ast = extractSymbols("let person = { address: { street: 'Wunderschoen 12' } };");

				// assert
				const variableDeclarator = ast.program.body[0].declarations[0];
				const address = variableDeclarator.init.properties[0];
				const addressSymbol = program.symbolTable.getSymbol(address);
				const addressObjectSymbol = program.symbolTable.getSymbol(address.value);

				expect(addressObjectSymbol).to.be.defined;
				expect(addressObjectSymbol).to.equal(addressSymbol);
			});

			it("creates a new symbol for an object that is directly passed to a function call", function () {
				const ast = extractSymbols("printAddress({ street: 'Wunderschoen 12' });");

				// assert
				const callExpression = ast.program.body[0].expression;
				const address = callExpression.arguments[0];
				const addressSymbol = program.symbolTable.getSymbol(address);

				expect(addressSymbol).to.be.defined;
			});
		});

		describe("ObjectProperty", function () {
			it("adds a symbol with flags Property and declaration equal to the property node as member to the symbol of the object expression", function () {
				// act
				const ast = extractSymbols("let person = { name: 'Micha' };");

				// assert
				const variableDeclarator = ast.program.body[0].declarations[0];
				const objectSymbol = program.symbolTable.getSymbol(variableDeclarator.init);

				expect(objectSymbol).to.have.symbolMember("name");
				expect(objectSymbol.getMember("name")).to.have.property("flags", SymbolFlags.Property);
				expect(objectSymbol.getMember("name")).to.have.property("declaration", variableDeclarator.init.properties[0]);
			});

			it("creates a symbol if the property key is a literal", function () {
				// act
				const ast = extractSymbols("let person = { 'name': 'Micha' };");

				// assert
				const variableDeclarator = ast.program.body[0].declarations[0];
				const objectSymbol = program.symbolTable.getSymbol(variableDeclarator.init);

				expect(objectSymbol).to.have.symbolMember("name");
				expect(objectSymbol.getMember("name")).to.have.property("flags", SymbolFlags.Property);
				expect(objectSymbol.getMember("name")).to.have.property("declaration", variableDeclarator.init.properties[0]);
			});

			it("does not add the symbol of the member to the current scope", function () {
				// act
				const ast = extractSymbols("let person = { name: 'Micha' };");

				// assert
				expect(ast.program.scope).not.to.have.ownSymbol("name");
			});

			it("associates the symbol with the property node", function () {
				// act
				const ast = extractSymbols("let person = { name: 'Micha' };");

				// assert
				const variableDeclarator = ast.program.body[0].declarations[0];
				expect(program.symbolTable.getSymbol(variableDeclarator.init.properties[0])).to.be.defined;
			});
		});

		describe("ObjectMethod", function () {
			it("adds a symbol with flags Property and declaration equal to the property node as member to the symbol of the object expression", function () {
				// act
				const ast = extractSymbols("let person = { name() {} };");

				// assert
				const variableDeclarator = ast.program.body[0].declarations[0];
				const objectSymbol = program.symbolTable.getSymbol(variableDeclarator.init);

				expect(objectSymbol).to.have.symbolMember("name");
				expect(objectSymbol.getMember("name")).to.have.property("flags", SymbolFlags.Property);
				expect(objectSymbol.getMember("name")).to.have.property("declaration", variableDeclarator.init.properties[0]);
			});

			it("associates the symbol with the property node", function () {
				// act
				const ast = extractSymbols("let person = { name() {} };");

				// assert
				const variableDeclarator = ast.program.body[0].declarations[0];
				expect(program.symbolTable.getSymbol(variableDeclarator.init.properties[0])).to.be.defined;
			});
		});

		describe("SequenceExpression", function () {
			it("sets the symbols for identifiers used in the expressions", function () {
				const ast = extractSymbols("p1, p2, p3;");

				expect(ast.program.scope).to.have.ownSymbol("p1");
				expect(ast.program.scope).to.have.ownSymbol("p2");
				expect(ast.program.scope).to.have.ownSymbol("p3");

				const sequenceExpression = ast.program.body[0].expression;
				expect(program.symbolTable.getSymbol(sequenceExpression.expressions[0])).not.to.be.undefined;
				expect(program.symbolTable.getSymbol(sequenceExpression.expressions[1])).not.to.be.undefined;
				expect(program.symbolTable.getSymbol(sequenceExpression.expressions[2])).not.to.be.undefined;
			});
		});

		describe("UnaryExpression", function () {
			it("creates a symbol for the identifier used in the argument to the current scope", function () {
				// act
				const ast = extractSymbols("!x");

				// assert
				expect(ast.program.scope).to.have.ownSymbol("x");
				expect(ast.program.scope.getOwnSymbol("x")).to.have.property("flags", SymbolFlags.Variable);
			});

			it("associates the argument node with the symbol", function () {
				// act
				const ast = extractSymbols("!x");

				// assert
				expect(program.symbolTable.getSymbol(ast.program.body[0].expression.argument)).to.be.defined;
			});
		});

		describe("BinaryExpression", function () {
			it("creates a symbol in the current scope for the identifiers used in the left and right hand side", function () {
				// act
				const ast = extractSymbols("x + y;");

				// assert
				expect(ast.program.scope).to.have.ownSymbol("x");
				expect(ast.program.scope.getOwnSymbol("x")).to.have.property("flags", SymbolFlags.Variable);

				expect(ast.program.scope).to.have.ownSymbol("y");
				expect(ast.program.scope.getOwnSymbol("y")).to.have.property("flags", SymbolFlags.Variable);
			});

			it("assigns the symbol for the left and right hand side with the corresponding identifier nodes", function () {
				// act
				const ast = extractSymbols("x + y;");

				// assert
				const binaryExpression = ast.program.body[0].expression;
				expect(program.symbolTable.getSymbol(binaryExpression.left)).to.be.equal(ast.program.scope.getOwnSymbol("x"));
				expect(program.symbolTable.getSymbol(binaryExpression.right)).to.be.equal(ast.program.scope.getOwnSymbol("y"));
			});
		});

		describe("AssignmentExpression", function () {
			it("creates a symbol for the assignee identifier node and associates it with the assignee", function () {
				// act
				const ast = extractSymbols("x = 10;");

				// assert
				expect(ast.program.scope).to.have.ownSymbol("x");
				expect(ast.program.scope.getOwnSymbol("x")).to.have.property("flags", SymbolFlags.Variable);
				expect(program.symbolTable.getSymbol(ast.program.body[0].expression.left)).to.equal(ast.program.scope.getOwnSymbol("x"));
			});

			it("creates a symbol for the member of the assignee  and associates it with the assignee if the assignee is a member expression", function () {
				// act
				const ast = extractSymbols("x.y = 10;");

				// assert
				expect(ast.program.scope).to.have.ownSymbol("x");
				expect(ast.program.scope.getOwnSymbol("x")).to.have.symbolMember("y");
				expect(program.symbolTable.getSymbol(ast.program.body[0].expression.left.property)).to.equal(ast.program.scope.getOwnSymbol("x").getMember("y"));
			});

			it("extracts the identifiers used in the right hand side of the assignment expression", function () {
				// act
				const ast = extractSymbols("x.y = z");

				// assert
				expect(ast.program.scope).to.have.ownSymbol("z");
				expect(program.symbolTable.getSymbol(ast.program.body[0].expression.right)).to.equal(ast.program.scope.getOwnSymbol("z"));
			});
		});

		describe("UpdateExpression", function () {
			it("creates a symbol for the identifier used in the argument to the current scope", function () {
				// act
				const ast = extractSymbols("++x");

				// assert
				expect(ast.program.scope).to.have.ownSymbol("x");
				expect(ast.program.scope.getOwnSymbol("x")).to.have.property("flags", SymbolFlags.Variable);
			});

			it("associates the argument node with the symbol", function () {
				// act
				const ast = extractSymbols("!x");

				// assert
				expect(program.symbolTable.getSymbol(ast.program.body[0].expression.argument)).to.be.defined;
			});
		});

		describe("LogicalExpression", function () {
			it("creates a symbol for the identifiers used in the left and right hand side to the current scope", function () {
				// act
				const ast = extractSymbols("x && y");

				// assert
				expect(ast.program.scope).to.have.ownSymbol("x");
				expect(ast.program.scope.getOwnSymbol("x")).to.have.property("flags", SymbolFlags.Variable);

				expect(ast.program.scope).to.have.ownSymbol("y");
				expect(ast.program.scope.getOwnSymbol("y")).to.have.property("flags", SymbolFlags.Variable);
			});

			it("associates the left and right hand side with the corresponding symbols", function () {
				// act
				const ast = extractSymbols("x && y");

				// assert
				expect(program.symbolTable.getSymbol(ast.program.body[0].expression.left)).to.be.equal(program.globalScope.getOwnSymbol("x"));
				expect(program.symbolTable.getSymbol(ast.program.body[0].expression.right)).to.be.equal(program.globalScope.getOwnSymbol("y"));
			});
		});

		describe("ConditionalExpression", function () {
			it("sets the symbols for identifiers used in the test, consequent and alternate expression", function () {
				const ast = extractSymbols("p1 ? p2 : p3");

				expect(ast.program.scope).to.have.ownSymbol("p1");
				expect(ast.program.scope).to.have.ownSymbol("p2");
				expect(ast.program.scope).to.have.ownSymbol("p3");

				const conditionExpression = ast.program.body[0].expression;
				expect(program.symbolTable.getSymbol(conditionExpression.test)).not.to.be.undefined;
				expect(program.symbolTable.getSymbol(conditionExpression.consequent)).not.to.be.undefined;
				expect(program.symbolTable.getSymbol(conditionExpression.alternate)).not.to.be.undefined;
			});
		});

		describe("CallExpression", function () {
			it("creates a symbol for each identifier used in the arguments", function () {
				// act
				const ast = extractSymbols("logger.log(x, y, z)");

				// assert
				expect(ast.program.scope).to.have.ownSymbol("x");
				expect(ast.program.scope.getOwnSymbol("x")).to.have.property("flags", SymbolFlags.Variable);

				expect(ast.program.scope).to.have.ownSymbol("y");
				expect(ast.program.scope.getOwnSymbol("y")).to.have.property("flags", SymbolFlags.Variable);

				expect(ast.program.scope).to.have.ownSymbol("z");
				expect(ast.program.scope.getOwnSymbol("z")).to.have.property("flags", SymbolFlags.Variable);
			});

			it("associates the argument nodes with the corresponding symbols", function () {
				// act
				const ast = extractSymbols("logger.log(x, y)");

				// assert
				const args = ast.program.body[0].expression.arguments;
				expect(program.symbolTable.getSymbol(args[0])).to.be.equal(program.globalScope.getOwnSymbol("x"));
				expect(program.symbolTable.getSymbol(args[1])).to.be.equal(program.globalScope.getOwnSymbol("y"));
			});

			it("associates the callee with the symbol of the called function", function () {
				// arrange
				const log = new Symbol("log", SymbolFlags.Property);
				program.globalScope.addSymbol(log);

				// act
				const ast = extractSymbols("log(x, y)");

				// assert
				const callExpression = ast.program.body[0].expression;
				expect(program.symbolTable.getSymbol(callExpression.callee)).to.be.equal(log);
			});

			it("Can handle member expressions on results of a call expressions", function () {
				const ast = extractSymbols(`
				angular.module('chatrooms').controller(
					  'appController',
					  ['$scope', 'user', function($scope, user) {
					    const placeholder = 'Enter a witty nickname';
					    const loginRequest = function(username) { user.loginRequest(username); };
					}]);
				`);

				// assert
				expect(program.symbolTable.getSymbol(ast.program.body[0].expression.callee.object)).not.to.be.undefined;
			});
		});

		describe("MemberExpression", function () {
			it("creates a symbol for the member on the object symbol", function () {
				// act
				const ast = extractSymbols(`
				let x = {};
				x.y;
				`);

				// assert
				const x = ast.program.scope.getOwnSymbol("x");
				expect(x).to.have.symbolMember("y");
				expect(x.getMember("y")).to.have.property("flags", SymbolFlags.Property);
			});

			it("creates symbols for nested members", function () {
				const ast = extractSymbols("x.y.z = 10");

				// assert
				expect(ast.program.scope).to.have.ownSymbol("x");

				const x = ast.program.scope.getOwnSymbol("x");
				expect(x).to.have.symbolMember("y");

				const y = x.getMember("y");
				expect(y).to.have.symbolMember("z");
			});

			it("associates the property node of the member expression with the symbol of the member", function () {
				// act
				const ast = extractSymbols("x.y");

				// assert
				const memberExpression = ast.program.body[0].expression;
				const x = ast.program.scope.getOwnSymbol("x");
				expect(program.symbolTable.getSymbol(memberExpression.property)).to.equal(x.getMember("y"));
			});

			it("associates the object node of the member expression with the symbol of the object", function () {
				// act
				const ast = extractSymbols("x.y");

				// assert
				const memberExpression = ast.program.body[0].expression;
				const x = ast.program.scope.getOwnSymbol("x");
				expect(program.symbolTable.getSymbol(memberExpression.object)).to.equal(x);
			});

			it("creates an anonymous symbol for a literal type e.g. 'test'.length", function () {
				// act
				const ast = extractSymbols("'test'.length");

				// assert
				const memberExpression = ast.program.body[0].expression;
				expect(program.symbolTable.getSymbol(memberExpression.object)).not.to.be.undefined;
			});

			it("associates the property with the computed symbol for computed members", function () {
				// act
				const ast = extractSymbols(`
					const numbers = [1, 2, 3, 4, 5];
					numbers[i];
				`);

				// assert
				const indexedAccess = ast.program.body[1].expression;
				expect(program.symbolTable.getSymbol(indexedAccess.property)).to.equal(Symbol.COMPUTED);
			});

			it("associates the property with a symbol for computed literal members", function () {
				// act
				const ast = extractSymbols(`
					const person = { name: "Test" };
					person["name"];
				`);

				// assert
				const indexedAccess = ast.program.body[1].expression;
				expect(program.symbolTable.getSymbol(indexedAccess.property)).not.to.equal(Symbol.COMPUTED);
				expect(program.symbolTable.getSymbol(indexedAccess.property).name).equal("name");
			});
		});
	});

	describe("Miscellaneous", function () {
		describe("StringLiteral", function () {
			it("are supported", function () {
				// act, assert
				expect(() => extractSymbols("x = 'test'")).not.to.throw();
			});
		});

		describe("NumericLiteral", function () {
			it("are supported", function () {
				// act, assert
				expect(() => extractSymbols("5")).not.to.throw();
			});
		});

		describe("BooleanLiteral", function () {
			it("are supported", function () {
				// act, assert
				expect(() => extractSymbols("true")).not.to.throw();
			});
		});

		describe("NullLiteral", function () {
			it("is supported", function () {
				// act, assert
				expect(() => extractSymbols("null")).not.to.throw();
			});
		});

		describe("DirectiveLiteral", function () {
			it("is supported", function () {
				expect(() => extractSymbols("'use strict';")).not.to.throw();
			});
		});

		describe("TemplateLiteral", function () {
			it("extracts the identifiers from the expressions", function () {
				// act
				const ast = extractSymbols("`Hallo ${user}`");

				// assert
				const templateLiteral = ast.program.body[0].expression;
				expect(ast.program.scope).to.have.ownSymbol("user");
				expect(program.symbolTable.getSymbol(templateLiteral.expressions[0])).not.to.be.undefined;
			});
		});
	});

	describe("Clauses", function () {
		describe("SwitchCase", function () {
			it("registers the identifiers in the test expression", function () {
				// act
				const ast = extractSymbols("switch ('test') { case x: }");

				// assert
				const scope = ast.program.scope;
				expect(scope).to.have.ownSymbol("x");
				expect(program.symbolTable.getSymbol(ast.program.body[0].cases[0].test)).not.to.be.undefined;
			});
		});

		describe("CatchClause", function () {
			it("registers the identifiers in the catch param expression", function () {
				// act
				const ast = extractSymbols("try { } catch (x) {}");

				// assert
				const scope = ast.program.scope;
				expect(scope).to.have.ownSymbol("x");
				expect(program.symbolTable.getSymbol(ast.program.body[0].handler.param)).not.to.be.undefined;
			});
		});
	});

	function extractSymbols(source) {
		const ast = parse(source);

		const symbolExtractor = createTraverseVisitorWrapper(new SymbolExtractor(program));
		traverse(ast, symbolExtractor);
		return ast;
	}
});

/**
 * Chai helper for testing if a scope contains a symbol with the given name
 */
Assertion.addMethod("ownSymbol", function (name) {
	new Assertion(this._obj).to.be.instanceOf(Scope);


	this.assert(
		this._obj.hasOwnSymbol(name),
		"expected #{this} to be have own symbol #{exp} but got #{act}",
		"expected #{this} not to contain own symbol #{act}",
		name, "[" + [...this._obj.symbols].join(", ") + "]"
	);
});

Assertion.addMethod("symbolMember", function (name) {
	new Assertion(this._obj).to.be.instanceOf(Symbol);


	this.assert(
		this._obj.hasMember(name),
		"expected #{this} to have member #{exp} but got #{act}",
		"expected #{this} not to contain member #{act}",
		name, "[" + [...this._obj.members.values()].join(", ") + "]"
	);
});
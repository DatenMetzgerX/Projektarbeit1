// import traverse from "babel-traverse";
// import * as t from "babel-types";
// import SourceFile from "./semantic-model/source-file";
// import Symbol from "./semantic-model/symbol";
// import chalk from "chalk";

import {parse} from "./parser";
import Program from "./semantic-model/program";
import createControlFlowGraph from "./cfg/cfg-builder";
import plot from "./cfg/plot";

export function inferProgram (entryFile, context) {
	const program = new Program(entryFile);

	infer(entryFile, context, program)  ;
	return program;
}

export function infer (file, context, program) {
	const content = context.moduleResolution.readFile(file);

	const canoncialName = context.moduleResolution.canoncialName(file);
	const sourceFile = program.createSourceFile(canoncialName, content);
	sourceFile.ast = parse(content, { sourceFilename: true });

	const cfg = createControlFlowGraph(sourceFile.ast);
	plot(cfg);
	console.log(cfg);

	/*const ast = parse(content);
	traverse(ast, 	{

		// const, let, var
		VariableDeclaration: function (path) {
			// TODO Test if Babel-Bindings are sufficient.
			for (const declaration of path.node.declarations) {
				const variable = new Symbol(declaration.id.name);

				variable.type = "Variable";
				variable.const = path.node.kind === "const";
				variable.declaration = path.node;
				variable.node = declaration;

				sourceFile.currentScope.addSymbol(variable);
			}
		},

		// x = ..., y.x = 1;
		AssignmentExpression: function (path) {
			if (t.isIdentifier(path.node.left)) {
				if (!sourceFile.currentScope.resolveSymbol(path.node.left.name)) {
					console.log(chalk.red(`the symbol ${path.node.left.name} is not yet defined`));
				}
			}
		}
	}); */

	program.addSourceFile(sourceFile);

	return sourceFile;
}

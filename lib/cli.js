import process from "process";
import {default as cliProgram} from "commander";
import pkginfo from "pkginfo";
import chalk from "chalk";

import Configuration from "./configuration";
import Context from "./context";
import {infer} from "./infer";
import {TypeInferenceError} from "./type-inference/type-inference-error";
import {Program} from "./semantic-model/program";
import {plotControlFlowGraph} from "./cfg/dot";

/* eslint-disable no-console */

pkginfo(module);

cliProgram.version(module.exports.version)
    .option("-f, --file <path>", "the entry file for the application to validate.")
	.option("-c, --cfg [path]", "outputs the generated control flow graph to the given path")
    .parse(process.argv);

if (!cliProgram.file) {
	console.error(chalk.red("no file to validate given"));
	cliProgram.help();
}

console.info(chalk.green("Initial memory usage", process.memoryUsage().rss / 1024 / 1024));

const configuration = new Configuration();
const context = new Context(configuration);
const program = new Program();

try {
	console.log(chalk.green(cliProgram.file));

	const content = context.moduleResolution.readFile(cliProgram.file);
	const canoncialName = context.moduleResolution.canoncialName(cliProgram.file);

	const sourceFile = program.createSourceFile(canoncialName, content);
	infer(sourceFile, program);

	if (cliProgram.cfg) {
		const options = cliProgram.cfg === true ? {} : { path: cliProgram.cfg };
		plotControlFlowGraph(sourceFile.ast.cfg, options);
	}

	const exitNode = sourceFile.ast.cfg.getNode(null);
	const typeEnvironment = exitNode.annotation.out;

	console.log("Final type environment in exit node:");
	typeEnvironment.dump(process.stdout);

	console.log(chalk.green("Final memory usage:", process.memoryUsage().rss / 1024 / 1024));
	console.log(chalk.green("Success"));
} catch (error) {
	let message;
	if (error instanceof TypeInferenceError) {
		const sourceFile = program.getSourceFile(error.node.loc.filename);
		message = chalk.red("Type inference failed for node ") + "\n" + sourceFile.codeFrame(error.node);
	} else {
		message = chalk.red("An error occurred during the program analysis");
	}

	console.log(message);
	console.log(error.stack);
}
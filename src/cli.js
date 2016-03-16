import process from "process";
import {default as cliProgram} from "commander";

import chalk from "chalk";
import Configuration from "./configuration";
import Context from "./context";
import {inferProgram} from "./infer";

cliProgram.version(require("../package.json").version)
    .option("-f, --file <path>", "the entry file for the application to validate.")
    .parse(process.argv);

if (!cliProgram.file) {
	console.error("no file to validate given");
	cliProgram.help();
}

const configuration = new Configuration();
const context = new Context(configuration);

const program = inferProgram(cliProgram.file, context);

for (const sourceFile of program.sourceFiles) {
	console.log(sourceFile.path);
	console.log(sourceFile.scope);

}
console.log(chalk.green("Success"));
import * as process from "process";
import program from "commander";
import {validate} from "./validator";

program.version(require("../package.json").version)
    .option("-f, --file <path>", "the entry file for the application to validate.")
    .parse(process.argv);

if (!program.file) {
	console.error("no file to validate given");
	program.help();
}


validate(program.file);
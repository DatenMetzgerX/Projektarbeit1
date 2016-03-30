import CfgBuilder from "./cfg/cfg-builder";
import SymbolExtractor from "./semantic-model/symbol-extractor";
import TypeInferenceAnalysis from "./type-inference/type-inference";

/* istanbul ignore next */
export function infer (file, context, program) {
	const content = context.moduleResolution.readFile(file);
	const canoncialName = context.moduleResolution.canoncialName(file);

	const sourceFile = program.createSourceFile(canoncialName, content);

	sourceFile.parse();
	sourceFile.analyse([new CfgBuilder(sourceFile.ast), new SymbolExtractor(program)]);

	// depends on the symbols, needs to be performed in a second traversal.
	sourceFile.analyse([new TypeInferenceAnalysis(program)]);

	return sourceFile;
}
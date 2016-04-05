import CfgBuilder from "./cfg/cfg-builder";
import SymbolExtractor from "./semantic-model/symbol-extractor";
import TypeInferenceAnalysis from "./type-inference/type-inference";

export function infer(sourceFile, program) {
	sourceFile.parse();
	sourceFile.analyse([new CfgBuilder(sourceFile.ast), new SymbolExtractor(program)]);

	// depends on the symbols, needs to be performed in a second traversal.
	sourceFile.analyse([new TypeInferenceAnalysis(program)]);

}


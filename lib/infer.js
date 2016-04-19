import {createTraverseVisitorWrapper} from "./util";
import CfgBuilder from "./cfg/cfg-builder";
import SymbolExtractor from "./semantic-model/symbol-extractor";
import {ForwardTypeInferenceAnalysis} from "./type-inference/forward-type-inference-analysis";

export function infer(sourceFile, program) {
	sourceFile.parse();

	const visitors = [createTraverseVisitorWrapper(new CfgBuilder(sourceFile.ast)), createTraverseVisitorWrapper(new SymbolExtractor(program))];
	sourceFile.analyse(visitors);

	const forwardTypeInferenceAnalysis = new ForwardTypeInferenceAnalysis(program);
	forwardTypeInferenceAnalysis.analyseSourceFile(sourceFile);
}


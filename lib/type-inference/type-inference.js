import assert from "assert";
import HindleyMilner from "./hindley-milner";

const hindleyMilnerVisitor = {
	Statement (path) {
		this.hindleyMilner.infer(path.node);
	}
};

export class TypeInferenceAnalysis {
	constructor(program) {
		this.program = program;
	}

	/**
	 * Initializes the analysis
	 */
	init() {
		this.hindleyMilner = new HindleyMilner(this.program);
	}

	complete() {
		this.hindleyMilner.typeEnvironment.assignTypeToSymbols();
	}

	get visitor() {
		return hindleyMilnerVisitor;
	}

	/**
	 * Returns the initial state required by this ast visitor
	 */
	get state() {
		assert (this.hindleyMilner, "The visitor needs to be initialize first");
		return { hindleyMilner: this.hindleyMilner};
	}
}

export default TypeInferenceAnalysis;
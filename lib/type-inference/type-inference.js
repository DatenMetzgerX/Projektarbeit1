import TypeEnvironment from "./type-environment";
import HindleyMilner from "./hindley-milner";

/**
 * Type inference data flow analysis
 * @implements {DataFlowAnalysis}
 */
export class TypeInferenceAnalysis {
	constructor(program) {
		this.program = program;
		this.hindleyMilner = new HindleyMilner(this.program);
	}

	createEmptyLattice() {
		return TypeEnvironment.EMPTY;
	}

	createEntryLattice() {
		return TypeEnvironment.EMPTY;
	}

	transfer(node, inTypeEnvironment) {
		if (node === null) {
			return inTypeEnvironment;
		}

		this.hindleyMilner.typeEnvironment = inTypeEnvironment;
		this.hindleyMilner.infer(node);
		return this.hindleyMilner.typeEnvironment;
	}

	joinBranches(outEnvironments) {
		const [head, ...tail] = outEnvironments;

		return head.merge(...tail);
	}

	areLatticesEqual(env1, env2) {
		return env1 === env2;
	}
}

export default TypeInferenceAnalysis;
import Immutable from "immutable";

const EMPTY_LATTICE = new Immutable.Set();
const ENTRY_LATTICE = new Immutable.Set();

/**
 *
 * @implements DataFlowAnalysis
 */
const TypeInferenceDataFlowAnalysis = {
	createEntryLattice() {
		return ENTRY_LATTICE;
	},

	createEmptyLattice() {
		return EMPTY_LATTICE;
	},

	joinBranches(branchesOutStates) {
		return new Immutable.Set().union(...branchesOutStates);
	},

	transfer(node, inSet) {
		const outSet = inSet.asMutable();
		if (!node) {
			return inSet;
		}

		switch (node.type) {
		case "VariableDeclaration":
			for (const declaration of node.declarations) {
				outSet.add(declaration.id.name);
				console.log(declaration.id.name);
			}
		}

		return outSet.asImmutable();
	},

	areLatticesEqual: Immutable.is
};

export default TypeInferenceDataFlowAnalysis;
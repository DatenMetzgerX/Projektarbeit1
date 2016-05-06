import * as t from "babel-types";
import {TypeVariable, FunctionType, VoidType} from "../../semantic-model/types";
import {BRANCHES} from "../../cfg/control-flow-graph";

/**
 * Refinement rule that handles function declarations, arrow functions and methods.
 * WIP.
 * @implements {RefinementRule}
 */
export class FunctionRefinementRule {
	canRefine(node) {
		return t.isFunction(node);
	}

	refine(node, context) {
		let type = context.getType(context.getSymbol(node));
		// The Type of function declarations is extracted before the worklist algorithm as these are hoisted.
		// If a function type is inferred again, return the old type. Otherwise a new function is created each time that
		// that has different type variables and therefore is never equal with the previous definition
		if (!type) {
			type = FunctionRefinementRule.inferFunctionType(node, context);
		}

		// set the updated type environment from the declaration
		type.typeEnvironment = context.typeEnvironment; // the type needs to contain it's own declaration

		return type;
	}

	static _getParameterTypes(node) {
		return node.params.map(() => TypeVariable.create());
	}

	static _getReturnType(node, context) {
		if (this._allNonExceptionExitsWithExplicitReturnStatement(node.body, context)) {
			return TypeVariable.create();
		}
		// at least one exit node has a non explicit return value and therefore the function might return void
		return VoidType.create();
	}

	static _allNonExceptionExitsWithExplicitReturnStatement(node, context) {
		const cfg = context.getCfg(node);
		const cfgNode = cfg.getNode(node);
		const exitEdges = Array.from(cfg.getExitEdges(cfgNode));

		for (const exitEdge of exitEdges) {
			if (!t.isReturnStatement(exitEdge.src.value) && exitEdge.branch !== BRANCHES.EXCEPTION) {
				return false;
			}
		}

		return exitEdges.length > 0;
	}

	static inferFunctionType(node, context) {
		const parameterTypes = this._getParameterTypes(node);
		const returnType = this._getReturnType(node, context);
		const type = new FunctionType(TypeVariable.create(), parameterTypes, returnType, node);

		context.setType(context.getSymbol(node), type);

		return type;
	}
}

export default FunctionRefinementRule;
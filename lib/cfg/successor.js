import assert from "assert";
import computeFallThrough from "./fallthrough";

/**
 * Returns the next consequent for the passed in path. It returns first consequent of any case or default statement
 * that follows this case path. This is needed for case statements that do not end with a break.
 * @param {NodePath} casePath the case statement for which the next consequent needs to be found
 * @returns {NodePath} the next consequent statement or null if there are no further statements.
 */
function getNextConsequentForCase (casePath) {
	do {
		casePath = casePath.getSibling(casePath.key + 1);
	} while (casePath.node && casePath.node.consequent.length === 0);

	if (casePath.node && casePath.node.consequent.length > 0) {
		return casePath.get("consequent")[0];
	}

	return null;
}

function computeBreakSuccessor (breakPath) {
	let parent = breakPath.parentPath;
	while (parent) {
		if (breakPath.node.label && parent.isLabeledStatement() && parent.node.label.name === breakPath.node.label.name) {
			break;
		}

		if (!breakPath.node.label && (parent.isSwitchStatement() || parent.isLoop())) {
			break;
		}

		if (parent.isTryStatement() && parent.node.finalizer) {
			// TODO #18 support continue, break and return statement inside of a try finally
			assert.fail("Break statements are not yet supported inside a try with a finally handler");
		}

		parent = parent.parentPath;
	}

	return computeSuccessor(parent);
}

function computeContinueSuccessor (continuePath) {
	let parent = continuePath.parentPath;
	while (parent.parentPath) {
		if (parent.isLoop() && (!continuePath.node.label || (parent.parentPath.isLabeledStatement() && parent.parentPath.node.label.name === continuePath.node.label.name))) {
			return parent;
		}

		if (parent.isTryStatement() && parent.node.finalizer) {
			// TODO #18 support continue, break and return statement inside of a try finally
			assert.fail("Continue statements are not yet supported inside a try with a finally handler");
		}

		parent = parent.parentPath;
	}

	assert.fail("Loop for continue statement not found");
}

/**
 * Determines the successor for the passed in path. The successor is that path that is executed next after the statement
 * reference by the passed in path. E.g. if the path points to continue statement, then the successor statement is the
 * direct parent loop that contains the continue statement (in case no labels are used). So the successor can even be a
 * previous statement.
 * @param {!NodePath} path the path for which the successor should be determined
 * @returns {NodePath} the successor node or null if the direct successor of this node is the EOF (end of file, or end of program).
 */
export function computeSuccessor (path) {
	const parent = path.parentPath;

	// if the parent is a "special" node and *not* a block statement, then the successor
	// is not the sibling (as there will be no other sibling) but the special semantic defined
	// by the parent node
	if (parent) {
		// if parent is a while or do while statement, then the successor is the while statement itself
		if (parent.isWhileStatement() || parent.isDoWhileStatement()) {
			return parent;
		}

		if (parent.isForStatement()) {
			// for (init; cond; update) {}
			if (parent.node.update) {
				return parent.get("update");
			}

			// for (init; cond;) {}
			return parent;
		}

		if (parent.isTryStatement() && parent.node.finalizer && parent.node.finalizer !== path.node) {
			return parent.get("finalizer");
		}

		// The successor of the last statement in a function body is the EOF node.
		if (parent.isFunction() && parent.node.body === path.node) {
			return null;
		}
	}

	// the successor of the break statement is the successor of the containing loop
	if (path.isBreakStatement()) {
		return computeBreakSuccessor(path);
	}

	if (path.isSwitchCase()) {
		const nextConsequent = getNextConsequentForCase(path);
		if (nextConsequent) {
			return nextConsequent;
		}
	}

	// the successor of a continue statement is the containing loop
	if (path.isContinueStatement()) {
		return computeContinueSuccessor(path);
	}

	// if the path is a program, then we have reached the end -> EOF
	if (path.isProgram()) {
		return null;
	}

	// for all other statements, the successor is the following sibling node
	let sibling = path.getSibling(path.key + 1);

	// If the node has no following sibling node, then we reached the end and need to continue on the upper level
	if (!sibling.node) {
		return computeSuccessor(path.parentPath);
	}

	return computeFallThrough(sibling);
}

export default computeSuccessor;

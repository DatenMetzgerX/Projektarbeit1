import assert from "assert";
import * as t from "babel-types";
import computeFallThrough from "./fallthrough";

/**
 * Finds the nearest parent that fulfills the passed in predicate
 * @param path the path for which the nearest parent should be found
 * @param predicate the predicate that needs to be fulfilled by the parent
 * @returns {NodePath} the parent path that fulfills the predicate or null if there exists no such parent.
 */
function getParent(path, predicate) {
	let potentialParent = path.parentPath;
	while (potentialParent && !predicate(potentialParent)) {
		potentialParent = potentialParent.parentPath;
	}

	return potentialParent;
}

/**
 * Returns the next consequent for the passed in path. It returns first consequent of any case or default statement
 * that follows this case path. This is needed for case statements that do not end with a break.
 * @param casePath {NodePath} the case statement for which the next consequent needs to be found
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
	const parentToBreak = getParent(breakPath, path => path.isLoop() || path.isSwitchStatement());

	assert(parentToBreak, "Parent statement outside of a loop or switch statements are not valid");
	return computeSuccessor(parentToBreak);
}

/**
 * Determines the successor for the passed in path. The successor is that path that is executed next after the statement
 * reference by the passed in path. E.g. if the path points to continue statement, then the successor statement is the
 * direct parent loop that contains the continue statement (in case no labels are used). So the successor can even be a
 * previous statement.
 * @param path {NodePath} the path for which the successor should be determined
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
		const parentLoop = getParent(path, t.isLoop);
		assert(parentLoop, "continue statement outside a loop is not valid");
		return parentLoop;
	}

	// if the path is a program, then we have reached the end -> EOF. If it is a function declaration, then the
	// control needs to be returned to the caller (null)
	if (path.isProgram() || path.isFunction()) {
		return null;
	}

	// for all other statements, the successor is the following sibling node, but function declarations need to be
	// skipped as they are not called.
	let sibling = path;
	do {
		sibling = sibling.getSibling(sibling.key + 1);
	} while (sibling.node && sibling.isFunction());

	// If the node has no following sibling node, then we reached the end and need to continue on the upper level
	if (!sibling.node || sibling.isFunction()) {
		return computeSuccessor(path.parentPath);
	}

	return computeFallThrough(sibling);
}

export default computeSuccessor;

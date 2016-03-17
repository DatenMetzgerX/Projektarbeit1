import assert from "assert";

function fallThrough (path) {
	if (path.isForStatement()) {
		return path.get("init");
	}

	return path;
}

function getParentLoopFor (path) {
	let potentialLoop = path;
	while (potentialLoop) {
		if (potentialLoop.isLoop()) {
			return potentialLoop;
		}
		potentialLoop = potentialLoop.parentPath;
	}

	/* istanbul ignore next */
	assert.fail("parent loop statement not found");
}

/**
 * Determines the successor for the passed in path. The successor is that path that is executed next after the statement
 * reference by the passed in path. E.g. if the path points to continue statement, then the successor statement is the
 * direct parent loop that contains the continue statement (in case no labels are used). So the successor can even be a
 * previous statement.
 * @param path {NodePath} the path for which the successor should be determined
 * @returns {NodePath} the successor node or null if the direct successor of this node is the EOF (end of file, or end of program).
 */
export function successor (path) {
	const parent = path.parentPath;

	if (parent) {
		// if parent is a while statement, then the successor is the while statement itself
		if (parent.isWhileStatement()) {
			return parent;
		}

		if (parent.isForStatement()) {
			// for (init; cond; update) {}
			return parent.get("update");
		}
	}

	// the successor of the break statement is the successor of the containing loop
	if (path.isBreakStatement()) {
		return successor(getParentLoopFor(path));
	}

	// the successor of a continue statement is the containing loop
	if (path.isContinueStatement()) {
		return getParentLoopFor(path);
	}

	// if the path is a program, then we have reached the end -> EOF
	if (path.isProgram()) {
		return null;
	}

	// for all other statements, the successor is the following sibling node.
	// If the node has no following sibling node, then we reached the end and need to continue on the upper level
	let sibling = path.getSibling(path.key + 1);
	if (!sibling.node) {
		return successor(path.parentPath);
	}

	return fallThrough(sibling);
}

export default successor;

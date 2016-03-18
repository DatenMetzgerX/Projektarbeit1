
/**
 * Computes the fall trough path of the passed in path if we want to get the first path of the node that should be
 * visited. E.g. the first node of a for statement is not the condition of the for statement but the init statement (if present).
 * @param path {NodePath} the path for which the fallthrough node should be determined
 * @returns {NodePath} the path to which it should fallthrough
 */
export function computeFallThrough (path) {
	// the first path in a for statement is the init statement if present
	if (path.isForStatement() && path.node.init) {
		return path.get("init");
	}

	return path;
}

export default computeFallThrough;

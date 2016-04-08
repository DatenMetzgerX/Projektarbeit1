import * as t from "babel-types";

function setParent (path) {
	path.node.parent = path.parent;
}

/**
 * Visitor that sets the parent node on each node. This allows upwards traversal when only the node is known without
 * the need for babel-traverse
 */
export const ParentInitializerVisitor = {};

// visitors merge does not support enter or exit, so we need to explicitly set the statement for each node.
for (const type in t.VISITOR_KEYS) {
	ParentInitializerVisitor[type] = setParent;
}



export default ParentInitializerVisitor;
import assert from "assert";

/**
 * Thrown error if an error occurs during type inference
 */
export class TypeInferenceError extends Error {
	/**
	 * Creates a new instance
	 * @param {Error|string} cause either an error object that describes the main cause or a message describing the error.
	 * @param {Node} node the node that has triggered the error
     */
	constructor(cause, node) {
		assert(cause, "A cause is required");
		assert(node, "The node that has caused the error is required");
		
		const message = cause instanceof Error ? cause.message : cause;
		super(`Type inference failure: ${message}`);

		if (cause instanceof Error) {
			this.stack = cause.stack;
		}
		this.node = node;
		this.cause = cause;
	}
}

export default TypeInferenceError;
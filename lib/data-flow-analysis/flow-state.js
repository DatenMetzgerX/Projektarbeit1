import assert from "assert";

export class FlowState {
	constructor(inState, outState) {
		assert (inState && outState, "In and out state cannot be null");
		this.in = inState;
		this.out = outState;
	}
}

export default FlowState;
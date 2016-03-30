import NodeModuleResolution from "./env/node-module-resolution";

/* istanbul ignore next */
export class Context {
	constructor(configuration) {
		if (configuration.moduleResolution === "node") {
			this.moduleResolution = new NodeModuleResolution();
		} else {
			throw new Error(`Unsupported module resolution ${configuration.moduleResolution}`);
		}

		this.configuration = configuration;
	}
}


export default Context;
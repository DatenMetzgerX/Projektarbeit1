import NodeModuleResolution from "./module-resolution/node-module-resolution";

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
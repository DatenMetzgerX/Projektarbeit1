"use strict";
const logger = {
	messages: [],
	log: function (m) {
		this.messages.push(m);
	}
}

const log = logger.log;
logger.log("Valid");
log("Runtime error");
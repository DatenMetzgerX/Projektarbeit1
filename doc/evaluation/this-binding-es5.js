"use strict";
var logger = {
	messages: [],
	log: function (m) {
		this.messages.push(m);
	}
}

logger.log("Valid");
var log = logger.log;
log("Invalid alias, this.messages is undefined");
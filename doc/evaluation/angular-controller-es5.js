function personController($http) {
	this.$http = $http;
	this.persons = [];
	
	this.loadPersons = function () {
	this.$http.gt("/persons")
		.then(response => this.persons = response.data);
	};
}
class PersonController {
	constructor($http) { 
		this.$http = $http;
		this.persons = [];
	}
	
	loadPersons() {
		this.$http.gt("/persons").then(
			response => this.persons = response.data);
	}
}
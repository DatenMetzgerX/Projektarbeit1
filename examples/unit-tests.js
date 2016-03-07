import * as jasmine from "jasmine-core";

const spyObject = jasmine.createSpyObj("myService", [ "save", "delete" ]);

// valid as createSpyObject creates a new object with a save and delete attribute that are jasmine spies.
spyObject.save.and.returnValue("test");
// @flow

import * as jasmine from "jasmine";

const spyObject = jasmine.createSpyObj("myService", [ "save", "delete" ]);

// valid as createSpyObject creates a new object with a save and delete attribute that are jasmine spies.
spyObject.save.and.returnValue("test");

// error
spyObject.save2.and.returnValue("test2");

// no errors detected by flow
const { setGlobalOptions } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");

// Set global options for all functions
setGlobalOptions({ region: 'europe-west1' });

// Initialize Firebase Admin SDK
initializeApp();

// Import your functions from the separate files
const getCollectionData = require('./getCollectionData');
const addtoqueue = require('./addtoqueue');
const addUser = require('./addUser');
const nextInQueue = require('./nextInQueue');
const mvresponse = require('./mvresponse');

// Export the functions as Firebase Cloud Functions
exports.getCollectionData = getCollectionData;
exports.addtoqueue = addtoqueue;
exports.addUser = addUser;
exports.nextInQueue = nextInQueue;
exports.mvresponse = mvresponse;
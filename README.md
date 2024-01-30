# Firebase Cloud Functions for Parking Management

This repository contains Firebase Cloud Functions for a parking management system, built using Node.js and Google Firebase.

**Features:**

1. **getCollectionData**: Fetches data from a specified Firestore collection.
2. **addtoqueue**: Adds a new message to the 'messages' Firestore collection.
3. **addUser**: Registers new users to the 'users' Firestore collection.
4. **nextInQueue**: Processes next entry in the 'queue' collection and posts user details to a webhook.
5. **mvresponse**: Processes MV response, groups data by parking bay, and stores results in the 'parkingfrommv' collection.
6. **checkParkingStatus**: Updates the status of parking bays based on 'parkingfrommv' data.

To get started, clone the repository and set up Firebase and Firestore. Ensure you've set environment variables for Firebase region and webhook URL.

Contributions are welcome. Please follow the existing code style for any contributions.

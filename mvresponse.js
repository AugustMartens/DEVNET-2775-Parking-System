const {onRequest} = require("firebase-functions/v2/https");
const {getFirestore} = require('firebase-admin/firestore');
const writeParkingStatus = require('./writeParkingStatus');


/**
 * Determines which parking quadrant the subject is in based on the given coordinates.
 * @param {object} coordinates - The coordinates object with properties: x0, x1, y0, y1.
 */
const getQuadrant = ({ x0, x1, y0, y1 }) => {
  const centerX = (x0 + x1) / 2;
  const centerY = (y0 + y1) / 2;
  if (centerX < 1442) return centerY < 1460 ? "Parking 1" : "Parking 3";
  return centerY < 1460 ? "Parking 2" : "Parking 4";
}

/**
 * Processes the response from the MV Smart Camera and updates the status of the parking bays.
 * If a subject is detected in a parking bay area, it means the parking bay is free.
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
const mvresponse = onRequest(async (req, res) => {
  const { subjects } = req.body;
  const db = getFirestore();

  // Map through the subjects and assign a parking bay to each subject based on its coordinates
  const filteredDataWithQuadrant = subjects.map(({ subject_uid_x, app_data }) => ({
    subject_uid_x,
    app_data: app_data.map(data => ({ ...data, parkingbay: getQuadrant(data.box) }))
  }));

  // Group subjects by parking bay
  const groupedData = filteredDataWithQuadrant.reduce((acc, { app_data, subject_uid_x }) => {
    app_data.forEach(({ parkingbay }) => {
      acc[parkingbay] = acc[parkingbay] || [];
      acc[parkingbay].push(subject_uid_x);
    });
    return acc;
  }, {});

  // Write the grouped data to Firestore
  for (const [parkingbay, data] of Object.entries(groupedData)) {
    const docRef = db.collection('parkingfrommv').doc(parkingbay);
    await docRef.set({ data });
  }

  res.status(200).send(groupedData);
  
  // Call writeParkingStatus() to update parking status based on new data
  await writeParkingStatus();
  
});

module.exports = mvresponse;
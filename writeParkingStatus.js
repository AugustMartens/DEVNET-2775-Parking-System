const {getFirestore, Timestamp} = require('firebase-admin/firestore');

/**
 * Update parking status in Firestore
 */
async function writeParkingStatus() {
  const db = getFirestore();

  // Define your parking bays
  const parkingBays = ["Parking 1", "Parking 2", "Parking 3", "Parking 4"];

  // Loop over each parking bay
  for (const parkingBay of parkingBays) {
    // Get the data of the parking bay from the 'parkingfrommv' collection
    const doc = await db.collection('parkingfrommv').doc(parkingBay).get();
    let bayIsFree = false;

    // If the document exists and it has data (subjects detected in the parking bay), the parking bay is free
    if (doc.exists && doc.data().data.length > 0) {
      bayIsFree = true;
    }

    // Write the status of the parking bay to the 'parkingbays' collection
    await db.collection('parkingbays').doc(parkingBay).set({
      isFree: bayIsFree,
      lastUpdated: Timestamp.now()
    });
  }

  console.log("Parking status updated.");
}

module.exports = writeParkingStatus;
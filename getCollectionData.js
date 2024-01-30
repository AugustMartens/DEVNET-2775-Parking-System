const {onRequest} = require("firebase-functions/v2/https");
const {getFirestore} = require('firebase-admin/firestore');

/**
 * Get collection data from Firestore
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
const getCollectionData = onRequest(async (req, res) => {
  const db = getFirestore();
  const collectionName = 'parkingbays'; 
  const snapshot = await db.collection(collectionName).get();

  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  res.status(200).json(data);
});

module.exports = getCollectionData;
const {onRequest} = require("firebase-functions/v2/https");
const {getFirestore} = require('firebase-admin/firestore');

/**
 * Add a message to Firestore
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
const addtoqueue = onRequest(async (req, res) => {
  // Grab the text parameters.
  const original = req.query.text;
  // Push the new message into Firestore using the Firebase Admin SDK.
  const writeResult = await getFirestore().collection("messages").add({original: original});
  // Send back a message that we've successfully written the message
  res.json({result: `Message with ID: ${writeResult.id} added.`});
});

module.exports = addtoqueue;
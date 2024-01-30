const {onRequest} = require("firebase-functions/v2/https");
const {getFirestore} = require('firebase-admin/firestore');
const fetch = require('node-fetch');

/**
 * Process the next user in queue
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
const nextInQueue = onRequest(async (req, res) => {
  const db = getFirestore();
  try {
      // Query the 'queue' collection to find the document with the earliest timestamp
      const snapshot = await db.collection('queue').orderBy('timestamp').limit(1).get();
      if (snapshot.empty) {
          return res.status(404).send('No documents in queue');
      }

      const queueEntry = snapshot.docs[0];
      const userid = queueEntry.data().userid;

      // Query the 'users' collection to get the phone number of the user
        const userSnapshot = await db.collection('users').doc(userid).get();
        if (!userSnapshot.exists) {
            return res.status(404).send('User not found');
        }

        const userPhoneNumber = userSnapshot.data().phone;

        console.log(JSON.stringify({ waid: userPhoneNumber }));

      // URL of the Webex Connect webhook
      const webhookUrl = process.env.WEBHOOK_URL || 'https://hooks.uk.webexconnect.io/events/L023REEZA0';

       // Send a POST request to the Webex Connect webhook
       const response = await fetch(webhookUrl, {
        method: 'POST',
        body: JSON.stringify({ waid: userPhoneNumber }),
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Webhook call failed: ${response.statusText}`);
    }

      // Remove the processed queue entry
      res.status(200).send(`Processed and removed user ID: ${userid}`);
      //await queueEntry.ref.delete();
  } catch (error) {
      console.error('Error processing queue:', error);
      res.status(500).send('Error processing queue');
  }
});

module.exports = nextInQueue;
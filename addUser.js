const {onRequest} = require("firebase-functions/v2/https");
const {getFirestore} = require('firebase-admin/firestore');

/**
 * Register a new user
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
const addUser = onRequest(async (req, res) => {
  // Check if method is POST
  if (req.method !== 'POST') {
      return res.status(400).send('Please send a POST request with user data');
  }

  const { name, numberplate, phone} = req.body;

  // Basic validation
  if (!phone || !name || !numberplate) {
      console.log('Phone number, name, and number plate are required');
      return res.status(400).send('Phone number, name, and number plate are required');
  }

  const db = getFirestore();
  const usersRef = db.collection('users');

  // Check if a user with the same phone number already exists
  const querySnapshot = await usersRef.where('phone', '==', phone).get();

  if (!querySnapshot.empty) {
      console.log('A user with this phone number already exists');
      return res.status(400).send('A user with this phone number already exists');
  }

  // Add new user if phone number doesn't exist
  const newUser = {
      name,
      numberplate,
      phone
  };
  
  const newUserRef = await usersRef.add(newUser);

  return res.status(200).send(`New user added with ID: ${newUserRef.id}`);
});

module.exports = addUser;
const functions = require('firebase-functions');// to handle new endpoints or intercept them
const admin = require('firebase-admin');// to access backend firebase resources, like DB
const cors = require('cors')({origin:true});// to allow all origin access

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

// setting up our firebase instance
const serviceAccount = require("./pwagram-firebase-adminsdk-keyfile.json");
admin.initializeApp({
    databaseURL: 'https://fancy-pwagram.firebaseio.com/',
    credential: admin.credential.cert(serviceAccount)
});

exports.storePostsData = functions.https.onRequest((request, response) => {
    // wrap to get cors headers
    cors( request, response, () => {
        // the table (or node), push to add new json object
        admin.database().ref('posts').push({
            id: request.body.id,
            title: request.body.title,
            location: request.body.location,
            image: request.body.image
        }).then( () => {
            response.status(201).json({message: "Data successfull stored!", id: request.body.id});
        }).catch( err => {
            response.status(500).json({error: err});
        })
    })
    //response.send("Hello from Firebase!");
});

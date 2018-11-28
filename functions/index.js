const functions = require('firebase-functions');// to handle new endpoints or intercept them
const admin = require('firebase-admin');// to access backend firebase resources, like DB
const cors = require('cors')({origin:true});// to allow all origin access
const webpush = require('web-push'); // to send web push messages

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
            // email, pub key, priv key
            webpush.setVapidDetails('mailto:luizpaulofranz@gmail.com', 'BHBtOC2vztZ5OdzUuZxFzyZwyGaxWWdpj23W52MQi7AH_2O4VflSLFWHq21ZyV_naj8qM9XaQ7QVM7_pFSZNDxI', 'JX9FZFKcqjkT-wba59wadj8g6XSrx8wvYMTjm0xqbNQ');
            return admin.database().ref('subscriptions').once('value');// only fetch data once
        }).then(subscriptions => {
            subscriptions.forEach( sub => {
                let pushConfig = {
                    endpoint: sub.val().endpoint,
                    keys: {
                        auth: sub.val().keys.auth,
                        p256dh: sub.val().keys.p256dh
                    }
                }
            // THAT'S HOW WE SEND PUSH NOTIFICATIONS! second argument is the payload, we can send whatever we want!
            webpush.sendNotification(pushConfig, JSON.stringify(
                {
                    title: 'New Post', 
                    content: 'New post added!',
                    openUrl: '/help' // by example for now
                }))
                .catch(err => {
                    console.log(err)
                });
            });

            response.status(201).json({message: "Data successfull stored!", id: request.body.id});
        }).catch( err => {
            response.status(500).json({error: err});
        })
    })
    //response.send("Hello from Firebase!");
});

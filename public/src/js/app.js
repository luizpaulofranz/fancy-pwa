var deferredPrompt;
var enableNotification = document.querySelectorAll('.enable-notifications');
// polyfill to promises, to older browsers
// is included in index.html
if (!window.Promise) {
   window.Promise = Promise;
}

// REGISTER OUR SW!
// check if the browser supports serviceWorker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/sw.js')
        .then(()=>{
            console.log('Service Worker registered!');
        });
}
// trate it to show the install banner when we click on specific button
// so here we cancel the default show banner event to handle ir latter
window.addEventListener('beforeinstallprompt', function(){
    console.log('beforeinstallprompt was fired.');
    event.preventDefault()
    deferredPrompt = event;
    return false;
});

function displayConfirmNotification() {
    let options = {
        body: 'You\'ve successfully subscribed to our Notification service!',
        icon: '/src/images/icons/app-icon-96x96.png',
        image: '/src/images/sf-boat.jpg',
        dir: 'ltr', // direction: left to right
        lang: 'pt-BR',
        vibrate: [100, 50, 200], // vibration pattern
        badge: '/src/images/icons/app-icon-96x96.png', // icon to android nitification bar
        tag: 'enable-notification', // identifier that allows to "group" notifications with same tag
        renotify: true, // renotifies user when new tagged notification comes 
        // actions showed with notification, not suported for all devices
        actions: [
            { action: 'confirm', title: 'Okay', icon: '/src/images/icons/app-icon-96x96.png' },
            { action: 'cancel', title: 'Cancel', icon: '/src/images/icons/app-icon-96x96.png' }
        ]
    };
    // here we use SW to show notification
    if ('serviceWorker' in navigator) {
        // returns a promise with our active SW
        navigator.serviceWorker.ready.then(sw => {
            sw.showNotification('Successfully subscribed!', options);
        })
    }
    // we can use notificartions without SW, but only SW can react to push
    //new Notification('Successfully subscribed!', options);
}

// to assign to the push notifications on backend
function configPushSubscription() {
    if (!("serviceWorker" in navigator)) {
        // we can't get server notifications without SWs
        return;
    }
    let srvcWrkr;
    navigator.serviceWorker.ready
    .then(sw => {
        srvcWrkr = sw;
        // getSubscriptions returns all existing subscriptions on this SW
        return sw.pushManager.getSubscription();
    })
    .then(subscriptions => {
        if (subscriptions === null) {
            // no subscriptions, create a new one
            var vapidPublicKey = 'BKapuZ3XLgt9UZhuEkodCrtnfBo9Smo-w1YXCIH8YidjHOFAU6XHpEnXefbuYslZY9vtlEnOAmU7Mc-kWh4gfmE';
            var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
            return reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidPublicKey
            });
        } else {
            // that's how we subscribe another push server
            srvcWrkr.pushManager.subscribe({
                userVisibleOnly: true
            })
            // there is a subscription, lets use the same 
        }
    })
    .then(function(newSub) {
        return fetch('https://pwagram-99adf.firebaseio.com/subscriptions.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(newSub)
        })
      })
      .then(function(res) {
        if (res.ok) {
          displayConfirmNotification();
        }
      })
      .catch(function(err) {
        console.log(err);
      });
}

// ask permission to send notifications on browser
function askNotificationPermission() {
    // Notification object
    Notification.requestPermission(result => {
        console.log('User Permission Notification: ', result);
        if (result != 'granted') {
            console.log('User deny Notifications.', result);
        } else {
            // here we subscribe user in our backend push notifications
            configPushSubscription()
            //displayConfirmNotification();
        }
    });
}

// check if browser supports Notification API
if ('Notification' in window && "serviceWorker" in navigator) {
    for (let i = 0; i < enableNotification.length; i++) {
        // if yes, we show up the buttons
        enableNotification[i].style.display = 'inline-block';
        enableNotification[i].addEventListener('click', askNotificationPermission);
    }
}
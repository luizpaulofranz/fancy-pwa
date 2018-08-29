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
var deferredPrompt;
window.addEventListener('beforeinstallprompt', function(){
    console.log('beforeinstallprompt was fired.');
    event.preventDefault()
    deferredPrompt = event;
    return false;
})
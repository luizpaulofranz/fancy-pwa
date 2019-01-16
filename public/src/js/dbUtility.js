// here we use idexedDB throug idb.js lib
// idb.js IS INCLUDED BEFORE THIS FILE IN INDEX.HTML
// name, version, and callback wich returns a promise
let dbPromise = idb.open('posts-store', 1, db => {
    // check if exists
    if(!db.objectStoreNames.contains('posts')) {
        // here wll create a "table", name and PK, keyPath sets the primary key name
        db.createObjectStore('posts', {keyPath: 'id'})
    }
    // another "table" for background sync
    if(!db.objectStoreNames.contains('sync-posts')) {
        db.createObjectStore('sync-posts', {keyPath: 'id'})
    }
});
// insert a single row
function writeData (objectStore, data) {
    return dbPromise.then(db => {
        let tx = db.transaction(objectStore, 'readwrite');
        let store = tx.objectStore(objectStore);
        store.put(data);
        return tx.complete;
    })
}
// retrieve all rows
function readAll(objectStore) {
    return dbPromise.then(db => {
        let tx = db.transaction(objectStore, 'readonly');
        let store = tx.objectStore(objectStore);
        return store.getAll();
    })
}
// retrieve single row
function getById(objectStore, id) {
    return dbPromise.then(db => {
        let tx = db.transaction(objectStore, 'readonly');
        let store = tx.objectStore(objectStore);
        return store.get(id);
    })
}
// removes all rows
function clearAll(objectStore) {
    return dbPromise.then(db => {
        let tx = db.transaction(objectStore, 'readwrite');
        let store = tx.objectStore(objectStore);
        store.clear();
        return tx.complete;
    })
}
// removes one row
function deleteRow(objectStore, id) {
    return dbPromise.then(db => {
        let tx = db.transaction(objectStore, 'readwrite');
        let store = tx.objectStore(objectStore);
        store.delete(id);
        return tx.complete;
    })
    .then(() => {
        console.log('Item '+id+' deleted!');
    })
}


// function to mount our Codified URL for PUSH
function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
// function convert base64 images to blob
function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ab], {type: mimeString});
    return blob;
  }
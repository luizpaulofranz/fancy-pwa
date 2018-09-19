// here we use idexedDB throug idb.js lib
// name, version, and callback wich returns a promise
let dbPromise = idb.open('posts-store', 1, db => {
    // check if exists
    if(!db.objectStoreNames.contains('posts')) {
        // here wll create a "table", name and PK, keyPath sets the primary key name
        db.createObjectStore('posts', {keyPath: 'id'})
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
// removes all rows
function clearAll(objectStore) {
    return dbPromise.then(db => {
        let tx = db.transaction(objectStore, 'readwrite');
        let store = tx.objectStore(objectStore);
        store.clear();
        return tx.complete;
    })
}
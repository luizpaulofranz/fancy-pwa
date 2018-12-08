var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
let titleInput = document.querySelector('#title');
let locationInput = document.querySelector('#location');
// camera handler feature selectors
let videoPlayer = document.querySelector('#player');
let canvasElement = document.querySelector('#canvas');
let captureButton = document.querySelector('#capture-btn');
let imagePicker = document.querySelector('#image-picker');
let imagePickerArea = document.querySelector('#pick-image');
let picture;

//initialize the camera or the file picker, depending of device
function initializeMediaPicker() {
  // here we create a kind if polyfill, to use webkit and moz implementation in old browsers
  if (!('mediaDevicer' in navigator)) {
    // so we force the creation of this modern object
    navigator.mediaDevices = {};
  }
  // here we check and add safari and mozilla old implementations
  if (!('getUserMedia' in navigator.mediaDevices)) {
    // constraint contains audio or video
    // here we implement the browsers method "getUserMedia" if it does'nt exists
    navigator.mediaDevices.getUserMedia = function(constraints) {
      let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      // if none of webkit and moz implementations are present, so we can't do anything
      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented by your browser!'));
      }
      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }
  }
  // with the polyfills above, we always have access to this method
  navigator.mediaDevices.getUserMedia({video:true})
    .then( stream => {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
    })
    .catch(error => {
      imagePickerArea.style.display = 'block';
    });
}

// here we capture a photo
captureButton.addEventListener('click', (event) => {
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';
  let context = canvasElement.getContext('2d');
  context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width));
  // here we stop our video transmission
  videoPlayer.srcObject.getVideoTracks().forEach(function(track) {
    track.stop();
  });
  // dataURItoBlob defined in dbUtility
  // toDataUrl codify canvas element in base64
  picture = dataURItoBlob(canvasElement.toDataURL());
});

// we add here the code to show our install banner
function openCreatePostModal() {
  // here we set our transform to open
  createPostArea.style.transform = 'translateY(0)'
  // initialize camera or file picker 
  initializeMediaPicker();
  // the banner is only possible to be showed after the browser tries to do it
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choiceResult => {
      console.log(choiceResult.outcome);

      if(choiceResult.outcome === "dismiss") {
        console.log('User cancel installation');
      } else {
        console.log('User ADD into home screen!');
      }

      deferredPrompt = null;
    });
  }
  /*
  // unregister all registered service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
    .then(registrations => {
      for (let i = 0; i < registrations.length; i++) {
        registrations[i].unregister();
      }
    })
  }*/
}

function closeCreatePostModal() {
  //createPostArea.style.display = 'none';
  createPostArea.style.transform = 'translateY(100vh)';
  videoPlayer.style.display = 'none';
  imagePickerArea.style.display = 'none';
  canvasElement.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// way to create cache on demand by users, here we have access to caches object too 
// we just need to handle a normal JS event, like click
function onSaveButtonClick(event) {
  console.log('Store cache on demand!');
  if ('caches' in window) { 
    caches.open('user-on-demand-cache')
    .then(cache => {
      cache.add('https://httpbin.org/get');
      cache.add('/src/images/sf-boat.jpg');
    })
  }

}

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

// dummy test card example
function createCard(data) {
  console.log('createCard: '+data);
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = `url("${data.image}")`;
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardTitle.style.color = 'white';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  /*var cardSaveButton = document.createElement('button');
  cardSaveButton.textContent = 'Save';
  cardSaveButton.addEventListener('click', onSaveButtonClick)
  cardSupportingText.appendChild(cardSaveButton);*/
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUi(data) {
  clearCards();
  for (let elem of data) {
    console.log('updateUi: '+elem);
    createCard(elem);
  }
}
/*
fetch('https://fancy-pwagram.firebaseio.com/posts.json')
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    createCard(...data); // and call the dummy example
  });
*/

/** ###### CACHE THEN NETWORK STRATEGY with dynamic cache ####### */
// see sw.js too
const url = 'https://fancy-pwagram.firebaseio.com/posts.json';
// if network is faster, don't replace content with cache
let networkDataReceived = false;

function firebaseReturnHelper(data) {
  let retorno = [];
  for (let key in data) {
    retorno.push(data[key]); 
  }
  return retorno;
}

fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    networkDataReceived = true;
    updateUi(firebaseReturnHelper(data));
  });
/*
if ('cache' in window) {
    caches.match(url)
      .then(function(response) {
        if (response) {
          return response.json();
        }
      })
      .then(function(data) {
        if (!networkDataReceived) {
          updateUi(firebaseReturnHelper(data));
        }
      });
  }
*/
// access data throug indexedDB
if ('indexedDB' in window) {
  readAll('posts').then(data => {
    if (!networkDataReceived) {
      console.log('From cache', data);
      updateUi(data);
    }
  })
}

function sendData() {
  let postData = new FormData();
  let id = new Date().toISOString();
  postData.add('id', id);
  postData.add('title', titleInput.value);
  postData.add('location', locationInput.value);
  postData.add('file', picture, id+'.png');

  fetch('https://us-central1-fancy-pwagram.cloudfunctions.net/storePostsData',{
    method: 'POST',
    body: postData
  })
  .then((res) => {
    console.log('Sent data.',res);
    updateUi();
  })
}

/* on form submition we use bacground sync */
form.addEventListener('submit', event => {
  event.preventDefault();

  if(titleInput.value.trim() == '' || locationInput.value.trim() == '') {
    alert('Please enter valid data!')
    return;
  }

  closeCreatePostModal();
  // here we check if our browser supports background sync
  if ('servieWorker' in navigator && 'SyncManager' in window) {
    // ready to check SW availability, returns a promise with SW instace
    navigator.serviceWorker.ready
    .then( sw => {
      // prepare and store data indexedDB to use background sync
      let post = {
        id: new Date().toString(),
        title: titleInput.value,
        location: locationInput.value,
        picture: picture
      }
      // dbUtility.js funciton
      writeData('sync-posts', post)
      .then(() => {
        // register background sync after insertion
        return sw.sync.register('sync-new-posts');
      })
      .then(() => {
        let snackBar = document.querySelector('#confirmation-toast');
        let data = {message: 'Your post was saved for syncing.'}
        // MaterialSnackbar is a property offered by material design
        snackBar.MaterialSnackbar.showSnackbar(data);
      })
      .catch( err => {
        console.log(err);
      });
    })
  } else {
    // if browser does not support background sync
    sendData();
  }
});
var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
let titleInput = document.querySelector('#title');
// camera handler feature selectors
let videoPlayer = document.querySelector('#player');
let canvasElement = document.querySelector('#canvas');
let captureButton = document.querySelector('#capture-btn');
let imagePicker = document.querySelector('#image-picker');
let imagePickerArea = document.querySelector('#pick-image');
let picture;
// location vars
let locationBtn = document.querySelector("#location-btn");
let locationLoader = document.querySelector("#location-loader");
let locationInput = document.querySelector("#location");
let fetchedLocation = {lat: 0, lng: 0};

locationBtn.addEventListener("click", () => {
  if (!("geolocation" in navigator)) {
    return;
  }
  let sawAlert = false;
  locationBtn.style.display = 'none';
  locationLoader.style.display = 'inline';
  // 3 params, 1st is success callback, 2nd is failure and 3rd is config params
  navigator.geolocation.getCurrentPosition( position => {
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';

    fetchedLocation = { lat: position.coords.latitude, lng: 0 };
    locationInput.value = 'Any Where';
    document.querySelector("#manual-location").classList.add("is-focused");
  }, err => {
    console.log("Error on getCurrentPosition. ", err);
    if (!sawAlert) {
      alert("We could'nt find a location, please enter manually.");
      sawAlert = true;
    }
    fetchedLocation = {lat: 0, lng: 0};
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';
  }, { timeout: 7000 });
});

//initialize the location depending of device, used when we open the new post modal
function initializeLocation() {
  if (!("geolocation" in navigator)) {
    locationBtn.style.display = 'none';
  }
}

//initialize the camera or the file picker, depending of device, used when we open the new post modal
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

// if have no camera
imagePicker.addEventListener('change', function(event) {
  picture = event.target.files[0];
});

// we add here the code to show our install banner
function openCreatePostModal() {
  // to update UI correctly, stop video takes a moment
  setTimeout(function() {
    // here we set our transform to open
    createPostArea.style.transform = 'translateY(0)'
  }, 1000);
  // initialize camera or file picker and GEO location support
  initializeMediaPicker();
  initializeLocation();
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
  videoPlayer.style.display = 'none';
  imagePickerArea.style.display = 'none';
  canvasElement.style.display = 'none';
  locationLoader.style.display = 'none';
  locationBtn.style.display = 'inline';
  captureButton.style.display = 'inline';
  // here we stop our video transmission
  if (videoPlayer.srcObject != null) {
    videoPlayer.srcObject.getVideoTracks().forEach(function(track) {
      track.stop();
    })
  }
  // to update UI correctly, stop video takes a moment
  setTimeout(function() {
    createPostArea.style.transform = 'translateY(100vh)';
  }, 1000);
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
    //console.log('updateUi: '+elem);
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
  // readAll is in dbUtility.js
  readAll('posts').then(data => {
    if (!networkDataReceived) {
      updateUi(data);
    }
  })
}

function sendData() {
  let postData = new FormData();
  let id = new Date().toISOString();
  postData.append('title', titleInput.value);
  postData.append('location', locationInput.value);
  postData.append('rawLocationLat', fetchedLocation.lat);
  postData.append('rawLocationLng', fetchedLocation.lng);
  postData.append('file', picture, id+'.png');
  postData.append('id', id);

  fetch('https://us-central1-fancy-pwagram.cloudfunctions.net/storePostsData',{
    method: 'POST',
    body: postData
  })
  .then((res) => {
    //console.log('Sent data.',res);
    updateUi();
  })
}

/* on form submition we use background sync */
form.addEventListener('submit', event => {
  event.preventDefault();
  if(titleInput.value.trim() == '' || locationInput.value.trim() == '') {
    alert('Please enter valid data!')
    return;
  }

  closeCreatePostModal();
  // here we check if our browser supports background sync
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    // ready to check SW availability, returns a promise with SW instace
    navigator.serviceWorker.ready
    .then( sw => {
      // prepare and store data indexedDB to use background sync
      let post = {
        id: new Date().toString(),
        title: titleInput.value,
        location: locationInput.value,
        picture: picture,
        rawLocation: fetchedLocation
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
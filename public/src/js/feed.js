var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');

// we add here the code to show our install banner
function openCreatePostModal() {
  // here we set our transform to open
  createPostArea.style.transform = 'translateY(0)'
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
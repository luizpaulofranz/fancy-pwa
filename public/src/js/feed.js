var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');

// we add here the code to show our install banner
function openCreatePostModal() {
  createPostArea.style.display = 'block';
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
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

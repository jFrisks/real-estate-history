'use strict';

console.log('RealEstateHistory - Load contentcript')
const unlikeButtonClassName = "save-listing__button--saved"
const likeAction = "likeButtonClicked"
const unlikeAction = "unlikeButtonClicked"
const getSavedListingStateAction = "getSavedListingState";
const hiSavedText = "HiSaved"
const hiUnsavedText = "Not saved in Hi"
const savedColor = "#2ef29a"
const unsavedColor = "#f24f2e"
const extensionButtonInfoClass = "hi-info-button"

window.addEventListener("load", function (event) {
    console.log('RealEstateHistory - Page loaded fully')

    //WHEN LIKE/UNLIKE-BUTTON CLICKED
    let likeUnlikeButton = document.querySelector('.property-gallery__button--first');
    var checkExist = setInterval(function () {
        likeUnlikeButton = document.querySelector('.property-gallery__button--first');
        if (likeUnlikeButton) {
            console.log("Like button found!");

            //Update likebutton to see if saved in HiHistory
            updateLikeButtonInfoText(likeUnlikeButton)

            //Click event listener
            likeUnlikeButton.addEventListener('click', (event) => handleClickLikeUnlike(event), false)
            clearInterval(checkExist);
        }
    }, 100); // check every 100ms
});

async function handleClickLikeUnlike(event) {
    const likeUnlikeButton = event.currentTarget;
    //const likeUnlikeButton = document.querySelector('.property-gallery__button--first');

    //check if liked or unliked
    const isUnliked = likeUnlikeButton.children[0].classList.contains(unlikeButtonClassName)
    let clickAction = isUnliked ? unlikeAction : likeAction

    //tell background script that button was clicked
    await sendMessageToBackgroundScript(clickAction)

    //Update buttonInfoText
    updateLikeButtonInfoText(likeUnlikeButton)
}

function sendMessageToBackgroundScript(action){
    const message = {
        action,
        url: window.location.href
    }
    //console.log('Extension registered like/unlike')
    //send message to extension
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(undefined, message, undefined, function (responseMessage) {
            //calback
            if(!responseMessage)
                return reject(chrome.runtime.lastError)
            //console.log(responseMessage)
            return resolve(responseMessage)
        })
    })
}

async function updateLikeButtonInfoText(likeButton){
    let isListingSavedInStorage = undefined;
    try{
        isListingSavedInStorage = await getIsListingSavedInStorage()
    }catch(err){
        console.error("An error appeared: " + err)
        isListingSavedInStorage = false;
    }

    //remove old button infotext if any
    const allExtensionInfoButtons = document.querySelectorAll(`.${extensionButtonInfoClass}`);
    allExtensionInfoButtons.forEach(button => button.remove())

    //Shows correct button info depending on if listing is saved or not
    if(isListingSavedInStorage){
        addSavedInfoToButton(likeButton)
    }else{
        addUnSavedInfoToButton(likeButton)
    }

    //Functions used in method
    function addSavedInfoToButton(button){
        //Add saved info from extension to button
        let savedIcon = document.createElement("I")
        savedIcon.setAttribute("class", `fa fa-cloud-download property-gallery__button-icon ${extensionButtonInfoClass}`)
        savedIcon.setAttribute("style", `color: ${savedColor}; margin-left:8px;`)
        button.appendChild(savedIcon)
                    
        let savedText = document.createElement("span")
        savedText.setAttribute("class", `property-gallery__button--label ${extensionButtonInfoClass}`)
        savedText.innerText = hiSavedText
        button.appendChild(savedText)
    }
    function addUnSavedInfoToButton(button){
        //Unsaved Text + Icon for hi data
        let unsavedIcon = document.createElement("I")
        unsavedIcon.setAttribute("class", `fa fa-exclamation property-gallery__button-icon ${extensionButtonInfoClass}`)
        unsavedIcon.setAttribute("style", `color: ${unsavedColor}; margin-left:8px;`)
        button.appendChild(unsavedIcon)

        let unsavedText = document.createElement("span")
        unsavedText.setAttribute("class", `property-gallery__button--label ${extensionButtonInfoClass}`)
        unsavedText.innerText = hiUnsavedText;
        button.appendChild(unsavedText)
    }
}

async function getIsListingSavedInStorage(){
    //Message background and ask
    let isSaved = undefined;
    try{
        const isSavedObject = await sendMessageToBackgroundScript(getSavedListingStateAction)
        isSaved = isSavedObject.isSaved;
    }catch(err){
        console.error(err);
        isSaved = false;
    }
    //get result from background 
    return isSaved
}
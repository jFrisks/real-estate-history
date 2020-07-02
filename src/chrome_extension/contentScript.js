'use strict';

console.log('RealEstateHistory - Load contentcript')
const unlikeButtonClassName = "save-listing__button--saved"
const likeAction = "likeButtonClicked"
const unlikeAction = "unlikeButtonClicked"
const getSavedListingStateAction = "getSavedListingState";
const hiSavedText = "HiSaved"
const savedColor = "#2ef29a"
const unsavedColor = "#f24f2e"

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
            likeUnlikeButton.addEventListener('click', () => handleClickLikeUnlike(), false)
            clearInterval(checkExist);
        }
    }, 100); // check every 100ms

    function handleClickLikeUnlike() {
        //check if liked or unliked
        const isUnliked = likeUnlikeButton.children[0].classList.contains(unlikeButtonClassName)
        let action = isUnliked ? unlikeAction : likeAction

        sendMessageToBackgroundScript(action)

    }
});

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
            return resolve(responseMessage.isSaved)
        })
    })
}

async function updateLikeButtonInfoText(likeButton){
    let isListingSavedInStorage = undefined;
    try{
        isListingSavedInStorage = await getIsListingSavedInStorage()
        console.log(isListingSavedInStorage);
    }catch(err){
        console.error("An error appeared: " + err)
        isListingSavedInStorage = false;
    }



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
        savedIcon.setAttribute("class", "fa fa-cloud-download property-gallery__button-icon")
        savedIcon.setAttribute("style", `color: ${savedColor}; margin-left:8px;`)
        button.appendChild(savedIcon)
                    
        let savedText = document.createElement("span")
        savedText.setAttribute("class", "property-gallery__button--label")
        savedText.innerText = hiSavedText
        button.appendChild(savedText)
    }
    function addUnSavedInfoToButton(button){
        //Unsaved Text + Icon for hi data
        let unsavedIcon = document.createElement("I")
        unsavedIcon.setAttribute("class", "fa fa-exclamation property-gallery__button-icon")
        unsavedIcon.setAttribute("style", `color: ${unsavedColor}; margin-left:8px;`)
        button.appendChild(unsavedIcon)

        let unsavedText = document.createElement("span")
        unsavedText.setAttribute("class", "property-gallery__button--label")
        unsavedText.innerText = "Not saved in Hi"
        button.appendChild(unsavedText)
    }
}

async function getIsListingSavedInStorage(){
    //Message background and ask
    let isSaved = undefined;
    try{
        isSaved = await sendMessageToBackgroundScript(getSavedListingStateAction)
    }catch(err){
        console.error(err);
        isSaved = false;
    }
    

    //get result from background 

    return isSaved
}

//TODO:  when button is clicked - update function for showing if saved
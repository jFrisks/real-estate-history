'use strict';

console.log('RealEstateHistory - Load contentcript')
const likeIconClassName = "save-listing-button__saved-icon";
const likeUnlikeButtonSelector = ".property-gallery__actionbar .save-listing-button";
const listingRemovedButtonSelector = ".qa-removed-listing-button";
const loadedListingPageAction = "loadedListingPageAction"
const likeAction = "likeButtonClicked"
const unlikeAction = "unlikeButtonClicked"
const propertyIdAction = "propertyId"
const currentPropertyIdAction = "currentPropertId"
const getSavedListingStateAction = "getSavedListingState";
const hiSavedText = "Sparad i HiBo"
const hiUnsavedText = "Osparad i HiBo"
const savedColor = "#2ef29a"
const unsavedColor = "#f24f2e"
const extensionButtonInfoClass = "hi-info-button";
const extensionButtonSavedInfoClass = "hi-info-button-saved";
const floatingHiboButtonClass = "hibo-floating";
const soldUrlRegex = '/salda';

window.addEventListener("load", async function (event) {
    console.log('RealEstateHistory - Page loaded fully')
    //SAVE LISTING (save url by using GET listing endpoint)
    //tell background script that button was clicked
    sendMessageToBackgroundScript(loadedListingPageAction).then((data) => {
        updateLikeButtonInfoText(likeUnlikeButton)
    })

    //WHEN LIKE/UNLIKE-BUTTON CLICKED
    let likeUnlikeButton = document.querySelector(likeUnlikeButtonSelector);
    var checkExist = setInterval(function () {
        likeUnlikeButton = document.querySelector(likeUnlikeButtonSelector);
        if (likeUnlikeButton) {
            console.log("Like button found!");

            //Update likebutton to see if saved in HiHistory
            updateLikeButtonInfoText(likeUnlikeButton)
    
            //Click event listener
            likeUnlikeButton.addEventListener('click', (event) => handleClickLikeUnlike(event), false)
            clearInterval(checkExist);
        }
        const listingRemovedButton = document.querySelector(listingRemovedButtonSelector);
        if(listingRemovedButton || isListingSoldUrl() ){
            clearInterval(checkExist);
            runMultipleTimesUntilTrue(async () => {
                const isSaved = await getIsListingSavedInStorage();
                if(isSaved){
                    renderFloatingHiboButton(); //TODO: Add new content script popup before able to show button
                    return true;
                }
                return false;
            }, 10, 500)
        }
    }, 100); // check every 100ms
});

function isListingSoldUrl(){
    return !!(location.href.match("/salda"))
}

function runMultipleTimesUntilTrue(localFunction, maxTimes, timeBetween){
    var timesRun = 0;
    var interval = setInterval(async function(){
        timesRun += 1;
        if(timesRun === maxTimes){
            clearInterval(interval);
        }
        const isTrue = await localFunction();
        if(isTrue){
            clearInterval(interval);
        }
    }, timeBetween); 
}

/** A very sketchy way to retrieve the property-id of a hemnet listing. Using script innerHTML and regex. */
function getPropertyId(){
    return Array.from(document.scripts).map(script => script.innerHTML).join(' ').match('"property"\s*:\s*{[^}]*"id"\s*:\s*([0-9]*)[,}]')[1]
}

async function handleClickLikeUnlike(event) {
    const likeUnlikeButton = event.currentTarget;

    //check if liked or unliked
    const isLiked = likeUnlikeButton.children[0].classList.contains(likeIconClassName)
    let clickAction = isLiked ? unlikeAction : likeAction

    //tell background script that button was clicked
    await sendMessageToBackgroundScript(clickAction)

    //Update buttonInfoText
    updateLikeButtonInfoText(likeUnlikeButton)
}

function sendMessageToBackgroundScript(action){
    const message = {
        action,
        url: window.location.href,
        property_id: getPropertyId()
    }
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

function removeButtonInfo(){
    //remove old button infotext if any
    const allExtensionInfoButtons = document.querySelectorAll(`.${extensionButtonInfoClass}`);
    allExtensionInfoButtons.forEach(button => button.remove())
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
    removeButtonInfo();

    //Shows correct button info depending on if listing is saved or not
    if(isListingSavedInStorage){
        addSavedInfoToButton(likeButton);
    }else{
        addUnSavedInfoToButton(likeButton)
    }

    //Functions used in method
    function addSavedInfoToButton(button){
        //Add saved info from extension to button
        let savedIcon = document.createElement("I")
        savedIcon.setAttribute("class", `fa fa-cloud-download property-gallery__button-icon ${extensionButtonInfoClass} ${extensionButtonSavedInfoClass}`)
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

/**
 * Message listener that listens for actions made by contentsctipt
 * Actions are prewritten with handlers that take care of the action
 */
 chrome.runtime.onMessage.addListener(function(message, sender, reply){
    switch(message.action){
        case propertyIdAction:
            handlePropertyIdAction(message, sender, reply);
            break;
        default:
            handleUnknownAction(message, sender, reply);
            break;
    }
    return true;
})

/** Handles if action is unkown to background script
 * It could be used if an unknown method-string is sent. Unkown is any other than the predfined actions listed as variables in background.js such as `likeAction`, `unlikeAction` etc
*/
function handleUnknownAction(message, sender, reply){
    //TODO: if message not defined
    //reply
    const msg = 'could not understand message sent to extension'
    reply(msg)
}

function handlePropertyIdAction(message, sender, reply){
    const property_id = getPropertyId();
    const options = {property_id}
    reply(options)
}

function renderFloatingHiboButton(){
    let savedIcon = document.createElement("a")
    savedIcon.setAttribute("class", `${floatingHiboButtonClass}`)
    const property_id = getPropertyId();
    const url = `https://hejbo.se/bostader/${property_id}`;
    savedIcon.setAttribute("href", url)

    //savedIcon.innerText = "HiBo\nView Image"

    let logo = document.createElement("img")
    logo.setAttribute("class", "hibo-floating-image");
    logo.src = 'https://hejbo.se/assets/img/hejbo-logo-full.png';
    savedIcon.appendChild(logo);

    // TODO: Fix this href clikc working while dragging
    // makeElementDraggable(savedIcon);

    document.body.appendChild(savedIcon)
}

function addNewButton(node){
    console.log("cloned")
    const clonedNode = node.cloneNode(true);
}

// credits: https://javascript.info/mouse-drag-and-drop
function makeElementDraggable(floatingElement){
    floatingElement.onmousedown = function(event) {

        let shiftX = event.clientX - floatingElement.getBoundingClientRect().left;
        let shiftY = event.clientY - floatingElement.getBoundingClientRect().top;
      
        floatingElement.style.position = 'fixed';
        floatingElement.style.zIndex = 1000;
        document.body.append(floatingElement);
      
        // moveAt(event.pageX, event.pageY);
        moveAt(event.clientX, event.clientY);
      
        // moves the floatingElement at (pageX, pageY) coordinates
        // taking initial shifts into account
        function moveAt(pageX, pageY) {
          floatingElement.style.left = pageX - shiftX + 'px';
          floatingElement.style.top = pageY - shiftY + 'px';
        }
      
        function onMouseMove(event) {
          moveAt(event.clientX, event.clientY);
        }
      
        // move the floatingElement on mousemove
        document.addEventListener('mousemove', onMouseMove);
      
        // drop the floatingElement, remove unneeded handlers
        floatingElement.onmouseup = function() {
          document.removeEventListener('mousemove', onMouseMove);
          floatingElement.onmouseup = null;
        };
      
      };
      
      floatingElement.ondragstart = function() {
        return false;
      };
}
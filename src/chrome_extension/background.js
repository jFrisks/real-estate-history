'use strict';
const isDev = false;
const likeAction = "likeButtonClicked";
const unlikeAction = "unlikeButtonClicked";
const isLoadingListingAction = "isLoadingListing";
const isNotLoadingListingAction = "isNotLoadingListing";
const getIsLoadingListingAction = "getIsLoadingListing";
const getSavedListingStateAction = "getSavedListingState";
const parseHemnetIdAction = "parseHemnetId";

/* MESSAGING is standardized to message = {action: "", ...options} */

var isLoadingListing = false

chrome.runtime.onInstalled.addListener(function () {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: { 
                    hostEquals: 'www.hemnet.se',
                    pathContains: 'bostad/'
                },
            })
            ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

function saveDataToListingObject(key, data, callback){
    //check if data exists
    if(!data || data.images === [])
        return callback('No data');
    //TODO - check for bad formatted data and if data already existing

    //save data to storage
    chrome.storage.local.set({[key]: data}, () => {
        const errors = chrome.runtime.lastError
        if(errors){
            sendNotificationInBrowser('error', `Error while saving to database - ${errors}`)
            return callback(errors)
        }

        console.log('Storage - added %o with key %s', data, key)
        sendNotificationInBrowser('success', "Successfully saved listing", "Wanna see the images? - Just click the extension icon in the top right corner in Chrome")
    });
    return callback(undefined, "saved data to listing with key " + key)
}

function removeListingObject(key, callback){
    chrome.storage.local.remove(key, () => {
        console.log('Storage - removed key %s', key)
    })
    return callback(undefined, "removed data listing from key " + key)
}

function handleOnMessageReply(err, result, replyMessage, sender, reply){
    if(err){
        console.error(err)
        return reply(err);
    }
    //reply 'like button unregistered in extension for url'
    const message = replyMessage + sender.tab.url + '. ' + result
    reply(message);
}

//TODO: Fix duplicate same as popup.js
function parseHemnetId(url){
    //"","bostad", "listing-id" -> want listing-id
    return new URL(url).pathname.split('/')[2];
}

function getListingThroughAPI(path, callback){
    const apiServer = isDev ? 'http://localhost:3000' : 'https://real-estate-history-server.herokuapp.com';
    const action = 'getListing'
    const apiURL = `${apiServer}/${action}/${path}`

    setIsLoading();

    //creating api call to apiURL from above and handling errors
    let xhr = new XMLHttpRequest();
    console.log(`Getting XHR Request from: ${apiURL}`)
    xhr.open("GET", apiURL, true);
    xhr.onload = function(e){
        if(xhr.readyState === 4){
            if(xhr.status === 200){
                let response = JSON.parse(xhr.responseText);
                callback(undefined, response);
            }else{
                handleError(xhr.statusText)
                callback(xhr.statusText)
            }
            setIsNotLoading(xhr.statusText);
        }
    }
    xhr.onerror = function(e){
        handleError(xhr.statusText)
        callback(xhr.statusText)
    }
    xhr.send(null);
}

function setIsLoading(){
    //set loading-state
    isLoadingListing = true;
    sendMessage(isLoadingListingAction);
}

function setIsNotLoading(status){
    //send message to extension scripts that xhr is done loading listing info
    isLoadingListing = false;
    sendMessage(isNotLoadingListingAction, {status: status})
}

/** Sets correct icon for extension based on the listing saved status.
 * If the listing is saved, the icon will show one color.
 * If the listing is not saved, the listing will show another color.
 * Method is run when listingStorage could have been changed, i.e when tab is activated and on likeButton-press.
*/
async function setCorrectIcon(isSaved, sender){
    const images = {
        "saved": {
            '16': "images/icon@16w.png",
            '32': "images/icon@32w.png",
            '48': "images/icon@48w.png",
            '128': "images/icon@128w.png",
        },
        "unsaved": {
            '16': "images/icon_unsaved@16w.png",
            '32': "images/icon_unsaved@32w.png",
            '48': "images/icon_unsaved@48w.png",
            '128': "images/icon_unsaved@128w.png"
        }
    };
    
    let details = {tabId: sender.tab.id};
    if(isSaved){
        details = {
            path: images["saved"], ...details
        };
    }else{
        details = {
            path: images["unsaved"], ...details
        };
    }
    chrome.pageAction.setIcon(details, undefined)
}
  
function sendMessage(action, options, callback = undefined){
    chrome.runtime.sendMessage({action: action, ...options}, (reply) => {
        if(callback){
            callback(reply);
        }
        else if(reply){
            console.log(reply);
        }else{
            //Popup is probably not up and running...
            //console.error(new Error(chrome.runtime.lastError));
        }
    })
}

function sendNotificationInBrowser(type, title, message){
    //Check types
    if(!(typeof title == "string" && typeof message == "string"))
        return

    let options = {
        type: "basic",
        iconUrl: "images/icon@48w.png",
        title: title,
        message: message,
        priority: 0,
    }

    console.log("ACTIVATING NOTIFICATION")
    //Check for specific type
    if(type === 'error'){
        options = {...options, title: "Error - " + title}
        chrome.notifications.create(undefined, options, undefined)
    }
    else if(type === 'success'){
        chrome.notifications.create(undefined, options, undefined)
    }
}

function handleError(text){
    console.error(text)
    sendNotificationInBrowser('error', "Error while saving the listing", text)
}

function getStorageData(listingPath, callback){
    //get storage of listingKey
    chrome.storage.local.get(listingPath, (localData) => {
        //Check standard data - local data
        console.log("Getting data for listing with returned data: ", localData)
        //if object, check if not empty
        if(localData && !(Object.keys(localData).length === 0 && localData.constructor == Object)){
            console.log("Returned as listingInfo:", localData[listingPath])
            return callback(localData[listingPath])    
        }
        else{
            //Check fallback storages (sync)
            chrome.storage.sync.get(listingPath, (fallbackData) => {
                callback(fallbackData[listingPath])
            })
        }
    });
}

/** Returns if listing is saved in storage.
 * @returns True if saved and false if not saved
 * Never rejects the promise
*/
function isListingSaved(listingPath){
    return new Promise((resolve, reject) => {
        getStorageData(listingPath, (listingData) => {
            if(!listingData || listingData == {} || listingData.images == []){
                return resolve(false);
            }
            return resolve(true)
        })
    })
}


/**
 * Message listener that listens for actions made by contentsctipt
 * Actions are prewritten with handlers that take care of the action
 */
chrome.runtime.onMessage.addListener(function(message, sender, reply){
    switch(message.action){
        case likeAction:
            handleLikeAction(message, sender, reply);
            break;
        case unlikeAction:
            handleUnlikeAction(message, sender, reply);
            break;
        case getIsLoadingListingAction:
            handleGetIsLoadingListingAction(message, sender, reply);
            break;
        case getSavedListingStateAction:
            handleGetSavedListingStateAction(message, sender, reply);
            break;
        default:
            handleUnknownAction(message, sender, reply);
            break;
    }
    return true;
})




/** Handlers for incoming messages */

/** Handles if action is unkown to background script
 * It could be used if an unknown method-string is sent. Unkown is any other than the predfined actions listed as variables in background.js such as `likeAction`, `unlikeAction` etc
*/
function handleUnknownAction(message, sender, reply){
    //TODO: if message not defined
    //reply
    const msg = 'could not understand message sent to extension'
    reply(msg)
}

function handleLikeAction(message, sender, reply){
    //likebutton
    const key = parseHemnetId(message.url)
    //THIS IS MOCKUP DATA
    //const data = testListingData
    //handleGetListingSuccess(data);
    getListingThroughAPI(message.url, (err, data) => {
        //check for error
        if(err){
            handleError(err)
            return reply(err);
        }else{
            //save retrieved data to local storage
            saveDataToListingObject(key, data[key], (err, result) => handleOnMessageReply(err,result, 'like button registered in extension for url', sender, reply));
        }
    });
}

function handleUnlikeAction(message, sender, reply){
    //unlikebutton
    //removeDataToListingObject
    const key = parseHemnetId(message.url)
    removeListingObject(key, (err, result) => handleOnMessageReply(err, result, 'like button unregistered in extension for url', sender, reply));
    //Updating icon for sender
    setCorrectIcon(false, sender);
}

function handleGetIsLoadingListingAction(message, sender, reply){
    //send new message of it is loading data or not
    if(isLoadingListing){
        setIsLoading();
    }else{
        setIsNotLoading();
    }
    reply();
}

async function handleGetSavedListingStateAction(message, sender, reply){
    const listingKey = parseHemnetId(message.url)
    console.log("Checking if key is saved in DB", listingKey)

    //Check if listing is saved, else reply with error
    try{
        const isSaved = await isListingSaved(listingKey);
        console.log("handleGetSavedListingStateAction:", isSaved)
        //Updating icon for sender
        setCorrectIcon(isSaved, sender);
        return reply({isSaved})
    }catch(err){
        //TODO: Should return error and handle it correctly
        console.error("handleGetSavedListingStateAction had an error:", err)
        return reply({isSaved: false})
    }
}

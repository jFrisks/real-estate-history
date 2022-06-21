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
            conditions: [
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: { 
                        hostEquals: 'www.hemnet.se',
                        pathContains: 'bostad/'
                    },
                }),
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: { 
                        hostEquals: 'www.hemnet.se',
                        pathContains: 'salda/'
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

function getListingThroughAPI({url, property_id}, callback){
    const apiServer = isDev ? 'http://localhost:3000' : 'https://f8jlejy4f8.execute-api.us-east-2.amazonaws.com/api/listings';
    const apiURL = `${apiServer}?url=${url}&property_id=${property_id}`;
    const retryDelay = 20000;
    let retries = 1;
    setIsLoading();
    callApi();

    function callApi(){ 
        //creating api call to apiURL from above and handling errors
        let xhr = new XMLHttpRequest();
        console.log(`Getting XHR Request from: ${apiURL}`)
        xhr.open("GET", apiURL, true);
        xhr.onload = function(e){
            if(xhr.readyState === 4){
                //TODO: Check if 304 -> need to check again in some time...
                if(xhr.status === 200){
                    let response = JSON.parse(xhr.responseText);
                    callback(undefined, response);
                    setIsNotLoading(xhr.statusText);
                }else if(xhr.status == 404){
                    //Resource does not exist but backend will try to fetch it. So we test later
                    //retry
                    if(retries--){
                        //TODO: Retry after xx seconds
                        setTimeout(()=>{
                            console.log("DEBUG: Retrying to call api")
                            callApi();
                        }, retryDelay)
                    }else{
                        handleError("Unable to fetch api after a number of retrites")
                        callback(xhr.statusText)
                        setIsNotLoading(xhr.statusText);
                    }
                }else{
                    handleError(xhr.statusText)
                    callback(xhr.statusText)
                    setIsNotLoading(xhr.statusText);
                }
            }
        }
        xhr.onerror = function(e){
            handleError(xhr.statusText)
            callback(xhr.statusText)
            setIsNotLoading(xhr.statusText);
        }
        xhr.send(null);
    }
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
    sendNotificationInBrowser('error', "Error while saving the listing", text)
}

function getStorageData(property_id, callback){
    //get storage of listingKey
    const key = property_id;
    chrome.storage.local.get(key, (localData) => {
        //Check standard data - local data
        console.log("Getting data for listing with returned data: ", localData)
        //if object, check if not empty
        if(localData && !(Object.keys(localData).length === 0 && localData.constructor == Object)){
            console.log("Returned as listingInfo:", localData[key])
            return callback(localData[key])    
        }
        else{
            //Check fallback storages (sync)
            chrome.storage.sync.get(key, (fallbackData) => {
                callback(fallbackData[key])
            })
        }
    });
}

/** Returns if listing is saved in storage.
 * @returns True if saved and false if not saved
 * Never rejects the promise
*/
function isListingSaved(key){
    return new Promise((resolve, reject) => {
        getStorageData(key, (listingData) => {
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
    //THIS IS MOCKUP DATA
    //const data = testListingData
    //handleGetListingSuccess(data);
    const property_id = message.property_id;
    getListingThroughAPI({url: message.url, property_id}, (err, data) => {
        //check for error
        if(err){
            handleError(err)
            return reply(err);
        }else{
            //save retrieved data to local storage
            saveDataToListingObject(property_id, data, (err, result) => handleOnMessageReply(err,result, 'like button registered in extension for url', sender, reply));
        }
    });
}

function handleUnlikeAction(message, sender, reply){
    //unlikebutton
    //removeDataToListingObject
    const key = message.property_id;
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
    const property_id = message.property_id;
    const listingKey = parseHemnetId(message.url)
    console.log("Checking if key is saved in DB", listingKey)
    //Check if listing is saved, else reply with error
    try{
        const key = property_id;
        const isSaved = await isListingSaved(key);
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

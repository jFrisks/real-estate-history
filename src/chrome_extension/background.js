'use strict';
const likeAction = "likeButtonClicked"
const unlikeAction = "unlikeButtonClicked"

chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.sync.set({ color: '#3aa757' }, function () {
        console.log("The color is green.");
    });

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

//Listens for if script-likebutton is fired
chrome.runtime.onMessage.addListener(function(message, sender, reply){
    if(!sender.tab) return reply("Message from non-content script")
    else if(message.action === likeAction){
        //likebutton
        const key = parseHemnetId(message.url)
        //THIS IS MOCKUP DATA
        //const data = testListingData
        //handleGetListingSuccess(data);
        getListingThroughAPI(message.url, (err, data) => {
            //check for error
            if(err){
                console.error(err);
                return reply(err);
            }else{
                //save retrieved data to local storage
                saveDataToListingObject(key, data[key], (err, result) => handleOnMessageReply(err,result, 'like button registered in extension for url', sender, reply));
            }
        });
    }
    else if(message.action === unlikeAction){
        //unlikebutton
        //TODO: get data from scrape-server

        //removeDataToListingObject
        const key = parseHemnetId(message.url)
        removeListingObject(key, (err, result) => handleOnMessageReply(err, result, 'like button unregistered in extension for url', sender, reply));
    }
    else{
        //TODO: if message not defined

        //reply
        const message = 'could not understand message sent to extension'
        reply(message)
    }
    return true;
})

function saveDataToListingObject(key, data, callback){
    //check if data exists
    if(!data)
        return callback('No data');
    //TODO - check for bad formatted data and if data already existing

    //save data to storage
    chrome.storage.sync.set({[key]: data}, () => {
        console.log('Storage - added %o with key %s', data, key)
    });
    return callback(undefined, "saved data to listing with key " + key)
}

function removeListingObject(key, callback){
    chrome.storage.sync.remove(key, () => {
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
    const apiServer = 'http://localhost:3000'
    const action = 'getListing'
    const apiURL = `${apiServer}/${action}/${path}`

    //creating api call to apiURL from above and handling errors
    let xhr = new XMLHttpRequest();
    xhr.open("GET", apiURL, true);
    xhr.onload = function(e){
        if(xhr.readyState === 4){
            if(xhr.status === 200){
                let response = JSON.parse(xhr.responseText);
                callback(undefined, response);
            }else{
                console.error(xhr.statusText)
                callback(xhr.statusText)
            }
        }
    }
    xhr.onerror = function(e){
        console.error(xhr.statusText)
        callback(xhr.statusText)
    }
    xhr.send(null);
}
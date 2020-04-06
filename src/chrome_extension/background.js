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
        //likebutton - TODO stuff

        //reply
        const message = 'like button registered in extension ' + sender.tab.url
        reply(message)
    }
    else if(message.action === unlikeAction){
        //unlikebutton - TODO stuff

        //reply
        const message = 'unlike button registered in extension ' + sender.tab.url
        reply(message)
    }
    else{
        //TODO stuff

        //reply
        const message = 'could not understand message sent to extension'
        reply(message)
    }
})

/** 
 * TODOS:
 * X Add eventlistener in background.js when savedbutton is pressed and active
 * X Send message to extension that it has been pushed
 * - Read message and do stuff
*/
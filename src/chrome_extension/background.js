'use strict';
const likeAction = "likeButtonClicked"
const unlikeAction = "unlikeButtonClicked"

const testListingData = { "street": "Strålgatan 23, 4 tr",
    "area": "Lilla Essingen \\ Kungsholmen, Stockholm",
    "startPrice": "2 895 000 kr",
    "propertyType": "Lägenhet",
    "tenure": "Bostadsrätt",
    "rooms": "2 rum",
    "livingSpace": "40 m²",
    "balcony": "Ja",
    "buildYear": "1938",
    "rent": "2 797 kr/mån",
    "operatingCost": "3 480 kr/år",
    "pricePerSquareMeter": "72 375 kr/m²",
    "images": 
     [ "https://bilder.hemnet.se/images/itemgallery_portrait_cut/f1/13/f113fa375c839b10252ab8c4721a0b15.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/11/df/11df0d54a75c05086cc3e38d9f603b9d.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/15/47/154799a2245a2dd82ba0d626ece8401f.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/57/19/5719cad505c35112c5a87f594c0f6480.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/55/b2/55b2b70237389a9c3cbecd245c56733f.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/b2/30/b2309142ea872e2dddaccb7764fe6a3e.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/31/ba/31babbe388fe8b89257ed3e50f92a55a.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/d5/9e/d59e06a6ee3b323afaf347225464b9f9.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/ed/3a/ed3a43af9b9d0257cb09d8cb81205878.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/fc/6a/fc6ad3e2b38c0199a1a185f8db1bfc70.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/b9/06/b9066ea6fc1b3bdc8738e7957d06910d.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/d9/ed/d9ed4f3057a805d8da144469e0f1067e.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/bc/bf/bcbfbe092c1e017e3c5c4f62e33c8d19.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/5e/bf/5ebf1f8dd3871187850048aa23de5e85.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/07/ec/07ec6251913d9d3aa737b44786b092fd.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/01/46/0146551612a9764c6019208a0e168b9c.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/5c/ed/5ced089931e93db5538cff640d93e087.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/56/a1/56a1b0fea165c54d139b18cd0cd73d54.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/7d/38/7d38afde169cc66cd1cd276890f11ea1.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/60/9c/609c5cb854f41227885d0838c410ca29.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/59/c7/59c7281f0078cf33c3195bc286dd573f.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/9f/92/9f929e5d0cf174902428feb67b825f1a.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/b8/a5/b8a58992bfc91e45a64dc56af4e3999a.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/44/87/4487e7655c90969027c0520bf0075e67.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/ee/1d/ee1d74440570716eef125bb56e62e913.jpg",
       "https://bilder.hemnet.se/images/itemgallery_portrait_cut/f1/13/f113fa375c839b10252ab8c4721a0b15.jpg",
       "https://bilder.hemnet.se/images/itemgallery_cut/11/df/11df0d54a75c05086cc3e38d9f603b9d.jpg"
    ]
}


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
        //TODO: get data from scrape-server
        //THIS IS MOCKUP DATA
        const data = testListingData
        const key = parseHemnetId(message.url)

        //save retrieved data to local storage
        saveDataToListingObject(key, data, (err, result) => {
            if(err)
                return reply(err)
            //reply
            const message = 'like button registered in extension for url' + sender.tab.url + ' and ' + result
            reply(message)
        })
        
    }
    else if(message.action === unlikeAction){
        //unlikebutton - TODO stuff
        //TODO: get data from scrape-server

        //TODO: removeDataToListingObject
        //reply
        const message = 'unlike button registered in extension ' + sender.tab.url
        reply(message)
    }
    else{
        //TODO: if message not defined

        //reply
        const message = 'could not understand message sent to extension'
        reply(message)
    }
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

//TODO: Fix duplicate same as popup.js
function parseHemnetId(url){
    //"","bostad", "listing-id" -> want listing-id
    return new URL(url).pathname.split('/')[2];
}

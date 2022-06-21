const isLoadingListingAction = "isLoadingListing";
const isNotLoadingListingAction = "isNotLoadingListing";
const getIsLoadingListingAction = "getIsLoadingListing";
const propertyIdAction = "propertyId"
const currentPropertyIdAction = "currentPropertId"
const showDetails = false;

function setupPopup(){
    //renderLogo();

    //Ask if data is loading, depending on if loading or not, the listener will render properly
    chrome.runtime.sendMessage({action: getIsLoadingListingAction}, () => {
        console.log('CALLED getIsLoadingListingAction');
    });

    renderListingInfo();
    addMailToEvent();
}
setupPopup();

function renderLogo(){
    const logoSrc = chrome.runtime.getURL('./images/icon@48w.png')
    const logo = document.getElementById('logo');
    logo.src = logoSrc;
}

/** Main method to render saved details of the listing
 * If no data found it will render error message
*/
function renderListingInfo(){
    function handleGetStorageCompleted(data) {
        //handling no data
        if(!data){
            renderMissingHistoryInfo();
            return;
        }
        
        removeRenderMissingHistoryInfo();
        //render details
        if(showDetails){
            renderListingDetails(data);
        }
        //render images if existing
        console.log('storage gotten', data);
        if(data.images){
            renderListingImages(data.images)
        }
    }

    getPropertyId().then((property_id) => {
        getStorageData(property_id, handleGetStorageCompleted)
    })
}

//private
function renderListingDetails(data){
    //get list of details
    const listing_details = document.getElementById('listing_details_table');

    //iterate over keys and put them as <ul>key - value</ul>
    for(let key in data){
        if(key !== "images"){
            //table consist of many rows wich looks like: | leftTitle | rightValue |
            const leftTitle = document.createElement('TH');
            const rightValue = document.createElement('TD');
            const row = document.createElement('TR');
            leftTitle.innerText = key;
            rightValue.innerText = data[key];
            row.appendChild(leftTitle);
            row.appendChild(rightValue);
            //add all
            listing_details.appendChild(row);
        }
    }
}

//private
function renderImages(parent, links){
    for(let i = 0; i < links.length; i++){
        let img = document.createElement('IMG');
        img.setAttribute("src", links[i]);
        img.setAttribute("width", "100%");
        parent.appendChild(img);
    }
}

function renderListingImages(links){
    let gallery = document.getElementById('imageGallery');
    renderImages(gallery, links)
}

function renderMissingHistoryInfo(){
    const infoContainer = document.getElementById('extension_info');

    //check for already rendered
    if(infoContainer.childElementCount > 0)
        return;

    const title = document.createElement('H1');
    const detailText = document.createElement('P');

    title.innerText = "Ohh no, no saved history :(";
    detailText.innerText = "Either you didn't have this extension when added the listing to saved objects, or the local image cache must have been deleted from your chrome";

    infoContainer.appendChild(title);
    infoContainer.appendChild(detailText);
}

function removeRenderMissingHistoryInfo(){
    const infoContainer = document.getElementById('extension_info');
    while (infoContainer.firstChild) {
        infoContainer.removeChild(infoContainer.lastChild);
    }
}
function renderLoading(){
    //check if alread loading -> dont need to add
    const loading = document.getElementsByClassName('loading')[0];
    if(!loading)
        return;
    loading.style.display = "inlinne-block";
}

function removeRenderLoading(){
    const loading = document.getElementsByClassName('loading')[0];
    if(!loading)
        return;
    loading.style.display = "none";
}

function getTabUrl(callback){
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const tab = tabs[0]
        const tabUrl = tab.url
        if(!tabUrl)
            return callback('tabUrl not deifned');
        const key = parseHemnetId(tabUrl)
        callback(undefined, key)
        
    })
}
/** Call for property id */
async function getPropertyId(){
    const {property_id} = await sendMessageToActiveContentScript(propertyIdAction);
    return property_id;
}

/** Gets listing data from storage by using listingKeyPath.
 * If no data is existent, the method will try fallback storage from depricated versions (storage.sync)
 */
function getStorageData(key, callback){
    //get storage of listingKey
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

function addMailToEvent() {
    const suggestButton = document.getElementById('suggestButton');
    suggestButton.onclick = () => {
        chrome.tabs.create({url: 'jonathan.frisk.tech@gmail.com?subject=subject&message=message'})
    }
}

function parseHemnetId(url){
    //"","bostad", "listing-id"
    return new URL(url).pathname.split('/')[2];
}


/** LISTENS FOR MESSAGES IN POPUP */
chrome.runtime.onMessage.addListener(function(message, sender, reply){
    if(message.action === isLoadingListingAction){
        //isLoadingImages
        renderLoading();
        reply("ADDED IS LOADING");
    }
    else if(message.action === isNotLoadingListingAction){
        //isLoadingImages
        removeRenderLoading();
        renderListingInfo();
        reply("ADDED IS NOT LOADING");
    }
    return true;
})

function sendMessageToActiveContentScript(action){
    const message = {
        action
    }
    //send message to extension
    return new Promise((resolve, reject) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, message, function (responseMessage) {
                //calback
                if(!responseMessage)
                    return reject(chrome.runtime.lastError)
                //console.log(responseMessage)
                return resolve(responseMessage)
            })
        })
    })
}
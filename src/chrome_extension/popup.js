const isLoadingListingAction = "isLoadingListing";
const isNotLoadingListingAction = "isNotLoadingListing";
const getIsLoadingListingAction = "getIsLoadingListing";

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

        //render details
        renderListingDetails(data);
        //render images if existing
        if(data.images){
            renderListingImages(data.images)
        }
    }

    getTabUrl((err, listingPath) => getStorageData(listingPath, handleGetStorageCompleted));
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

function renderLoading(){
    //check if alread loading -> dont need to add
    const loadingList = document.getElementsByClassName('loading');
    if(loadingList.length > 0){
        return;
    }

    const loading = document.createElement('div');
    const listingInfo = document.getElementsByClassName('listing_info')[0];
    loading.className = "loading";
    loading.innerHTML = "<div></div><div></div><div></div><div></div>"
    //insert loading before listing_info
    listingInfo.appendChild(loading);
}

function removeRenderLoading(){
    //TODO: remove loading
    const loading = document.getElementsByClassName('loading')[0];
    if(loading){
        loading.remove();
    }
}

function getTabUrl(callback){
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const tab = tabs[0]
        const tabUrl = tab.url
        if(!tabUrl)
            return callback('tabUrl not deifned');
        
        const listingPath = parseHemnetId(tabUrl)
        console.log(listingPath)
        callback(undefined, listingPath)
        
    })
}

function getStorageData(listingPath, callback){
    //get info about current id
    chrome.storage.sync.get(listingPath, (data) => callback(data[listingPath]));
}

function addMailToEvent() {
    const suggestButton = document.getElementById('suggestButton');
    suggestButton.onclick = () => {
        chrome.tabs.create({url: 'mailto:jonathan.frisk.tech@gmail.com?subject=subject&message=message'})
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
        console.log('LOADING');
        reply("ADDED IS LOADING");
    }
    else if(message.action === isNotLoadingListingAction){
        //isLoadingImages
        removeRenderLoading();
        renderListingInfo();
        renderNewNotification();
        console.log('DONE LOADING');
        reply("ADDED IS NOT LOADING");
    }
    return true;
})
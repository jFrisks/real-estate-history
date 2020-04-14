
let gallery = document.getElementById('imageGallery');
getListingInfo();

function renderListingDetails(data){
    //get list of details
    const listing_details = document.getElementById('listing_details');

    //iterate over keys and put them as <ul>key - value</ul>
    for(let key in data){
        if(key !== "images"){
            const li = document.createElement('LI');
            li.innerHTML = `${key} - ${data[key]}`;
            listing_details.appendChild(li);
        }
    }
}

function renderImages(parent, links){
    for(let i = 0; i < links.length; i++){
        let img = document.createElement('IMG');
        img.setAttribute("src", links[i]);
        img.setAttribute("width", "300");
        parent.appendChild(img);
    }
}

function renderListingImages(links){
    let gallery = document.getElementById('imageGallery');
    renderImages(gallery, links)
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

function getListingInfo(){
    function handleStorageCompleted(data) {
        console.log('got data', data)

        renderListingDetails(data);

        if(data.images){
            renderListingImages(data.images)
        }
    }

    getTabUrl((err, listingPath) => getStorageData(listingPath, handleStorageCompleted));
}

function getStorageData(listingPath, callback){
    //get info about current id
    chrome.storage.sync.get(listingPath, (data) => callback(data[listingPath]));
}

function parseHemnetId(url){
    //"","bostad", "listing-id"
    return new URL(url).pathname.split('/')[2];
}
let changeColor = document.getElementById('changeColor');
let gallery = document.getElementById('imageGallery');
const links = ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80", "https://images.unsplash.com/photo-1568634143420-dc5368d74e4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80"]

getListingInfo();

chrome.storage.sync.get('color', function(data) {
  changeColor.style.backgroundColor = data.color;
  changeColor.setAttribute('value', data.color);
});

changeColor.onclick = function(element){
    let color = element.target.value;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.executeScript(
            tabs[0].id,
            {code: 'document.body.style.backgroundColor = "' + color + '";'}
        );
    });
};

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
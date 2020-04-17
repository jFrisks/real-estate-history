const imageScraper = require('./imageScraper')
const infoScraper = require('./infoScraper')();
const { mergeDeep, generateIdFromUrl } = require('./utils');


function mainScraper(){
    const imageSc = imageScraper();
    
    function setUp(){
        imageSc.launch()
    }
    function shutdown(){
        imageSc.shutdown();
    }
    setUp();

    async function getFilteredListingsURL(options = {url: 'https://www.hemnet.se/bostader?location_ids%5B%5D=898741&item_types%5B%5D=bostadsratt&rooms_min=2&living_area_min=30&price_min=1750000&price_max=3500000'}){
        //TODO: get params to filter search
        const listingsURL = options.url;
        const listingLinks = await infoScraper.scrapeInfo(listingsURL, ($) => infoScraper.getListingsLink($));
        return listingLinks;
    }
    
    /** Main function to get info from listings
     *  Provide options for the listing search on Hemnet. Such as url, max-price...
    */
    async function getListings(listingLinks) {
        try{
            const listingsInfo = await getListingsInfo(listingLinks, async (link) => await infoScraper.getPageListingInfo(link))
            const listingsImage = await getPageListingImages(listingLinks)
            //Combine everything
            const combinedListings = mergeDeep(listingsInfo, listingsImage)
        
            console.log('ListingsInfo: ', combinedListings)
            return combinedListings;
        }catch(e){
            console.error(e);
            return undefined;
        }   
        
    }
    
    async function getPageListingImages(listingLinks) {
        console.log('launched headless imageScraper')
        
        //DO THIS FOR ALL - Will get objects with empty values if error
        try{
            const listingsImage = await getListingsInfo(listingLinks, async (link) => await imageSc.getListingImagesHemnet(link))
            console.log('shuttingdown the headless imageScraper')
            return listingsImage;
        }catch(e){
            console.log('shuttingdown the headless imageScraper after error')
            //restart imageSC
            await imageSc.shutdown();
            await imageSc.launch();
            throw e;
        }    
    }
    
    /** Gets Listing Info specified by method in paramp5.BandPass()
     * Returns {[id]: listingInfo} or if error: undefined
     * @param {*} listingsLinks 
     * @param {*} getSpecificPageInfoMethod 
     */
    const getListingsInfo = async (listingsLinks, getSpecificPageInfoMethod) => {
        const allListingsInfo = await Promise.all(listingsLinks.map(async (link, index) => {
            //const listingInfo = await getPageListingInfo(link)
            const id = generateIdFromUrl({"url": link})
            const listingInfo = await getSpecificPageInfoMethod(link)
            const result = {[id]: listingInfo}
            return result
        }));
        let listings = {}
    
        for(let i = 0; i < allListingsInfo.length; i++){
            listings = {
                ...listings,
                ...allListingsInfo[i]
            }
        }
        return listings;
    }

    //TODO: remove unneccesary exports
    return {
        getListings,
        getListingsInfo,
        getPageListingImages,
        getFilteredListingsURL,
        shutdown,
    }
}


module.exports = mainScraper;
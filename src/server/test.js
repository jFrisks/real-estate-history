const mainScraper = require('./server');

const testListings = [
    "https://www.hemnet.se/bostad/lagenhet-2rum-sodermalm-stockholms-kommun-slipgatan-12,-1,5-tr-16659036", 
    "https://www.hemnet.se/bostad/lagenhet-2rum-lilla-essingen-kungsholmen-stockholms-kommun-stralgatan-23,-4-tr-16759892"
]

async function test(){
    //const result = await mainScraper.getListingsInfo(listingLinks, async (link) => await mainScraper.getPageListingInfo(link))
    //const result = await mainScraper.getListingsInfo(listingLinks, async (link) => await mainScraper.getPageListingImages(link))
    //const result = await mainScraper.getPageListingImages(listingLinks)
    //console.log('Result of test is', result)

    // const x = {"1": {"a": "hej"}, "2":{"a": "hej"}}
    // const y = {"1": {"b": "san"}, "2":{"b": "san"}}
    // console.log(mergeDeep(x, y))

    mainScraper.getListings(testListings);
}
test();
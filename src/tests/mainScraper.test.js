const scraper = require('../server/mainScraper');
const { generateIdFromUrl } = require('../server/utils')

let mainScraper;

beforeAll(() => {
    return mainScraper = scraper();
})

test('one buyable listing links', async () => {
    jest.setTimeout(40000);
    const testListings = [
        "https://www.hemnet.se/bostad/lagenhet-2rum-sodermalm-stockholms-kommun-slipgatan-12,-1,5-tr-16659036"
    ]
    const listings = await mainScraper.getListings(testListings);
    const listingIDs = testListings.map((link, index) => generateIdFromUrl({url: link}))
    //expect result to be {id1: {images:[], ...other}, id2: {images:[], ...other}

    expect(listings).toBeDefined();
    //expect(listings).toBe({"lagenhet-2rum-lilla-essingen-kungsholmen-stockholms-kommun-stralgatan-23,-4-tr-16759892": "hej"});
    expect(listings).toHaveProperty(listingIDs[0])
    const listing1Obj = listings[listingIDs[0]];
    expect(listing1Obj.images).toBeDefined();
    expect(listing1Obj.images[0]).toEqual(
        expect.stringMatching(/http/)
    );
    return listings;
});

test('bad link should return empty object', async () => {
    jest.setTimeout(40000);
    const badURL = "https://www.hemnet.se/bostad/lagenhet-2rum-sodermalm-stockholms-kommun-slipgatan-12,-1,5-tr-16659036-BAD"
    const listing = await mainScraper.getListings([badURL]);

    //Should be empty, not return error
    expect(listing).toBeUndefined();
})

// async function test(){
//     //const result = await mainScraper.getListingsInfo(listingLinks, async (link) => await mainScraper.getPageListingInfo(link))
//     //const result = await mainScraper.getListingsInfo(listingLinks, async (link) => await mainScraper.getPageListingImages(link))
//     //const result = await mainScraper.getPageListingImages(listingLinks)
//     //console.log('Result of test is', result)

//     // const x = {"1": {"a": "hej"}, "2":{"a": "hej"}}
//     // const y = {"1": {"b": "san"}, "2":{"b": "san"}}
//     // console.log(mergeDeep(x, y))
// }

// function testSoldListing(){
//     //test solf but old link

//     //test sold on sold-link

// }

// function testTerminatedServer(){

// }

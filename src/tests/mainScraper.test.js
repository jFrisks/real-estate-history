const scraper = require('../server/mainScraper');
const { generateIdFromUrl } = require('../server/utils')

let mainScraper;

beforeAll(() => {
    mainScraper = scraper();
})

afterAll(async () => {
    await mainScraper.shutdown()
})

test('get one buyable listing details', async () => {
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

test('Get listing links from given filter', async () => {
    const links = await mainScraper.getFilteredListingsURL();

    expect(links).toBeDefined();
    expect(links[0]).toEqual(
        expect.stringMatching(/http/)
    )

    return links;
})

test('one reqeust with 5 buyable listings links from first filtered on hemnet', async () => {
    const firstIndex = 0
    const lastIndex = 4
    jest.setTimeout(40000);
    //get 10 links
    const links = (await mainScraper.getFilteredListingsURL()).slice(firstIndex, lastIndex);

    //TODO: get details from all links
    const listings = await mainScraper.getListings(links);
    const listingIDs = links.map((link, index) => generateIdFromUrl({url: link}))


    //test expectations
    expect(listings).toBeDefined();
    //test if listingID[first] and [last] is in listings
    expect(listings).toHaveProperty(listingIDs[firstIndex])
    expect(listings).toHaveProperty(listingIDs[lastIndex])

    const listing1ObjFirst = listings[listingIDs[firstIndex]];
    const listing1ObjLast = listings[listingIDs[lastIndex]];

    //check borh objects for images
    expect(listing1ObjFirst.images).toBeDefined();
    expect(listing1ObjLast.images).toBeDefined();

    //check both images has links
    expect(listing1ObjFirst.images[0]).toEqual(
        expect.stringMatching(/http/)
    );
    expect(listing1ObjLast.images[0]).toEqual(
        expect.stringMatching(/http/)
    );
    return [links, listings];
});

test('bad link should return empty object', async () => {
    jest.setTimeout(40000);
    const badURL = "https://www.hemnet.se/bostad/lagenhet-2rum-sodermalm-stockholms-kommun-slipgatan-12,-1,5-tr-16659036-BAD"
    const listing = await mainScraper.getListings([badURL]);

    //Should be empty, not return error
    expect(listing).toBeUndefined();
    return listing;
})

const request = require('request')
const cheerio = require('cheerio')
const translator = require('./translator')()
const scraper = require('./scraper')
const URL = require('url');
const { mergeDeep } = require('./utils');

const testListings = [
    "https://www.hemnet.se/bostad/lagenhet-2rum-sodermalm-stockholms-kommun-slipgatan-12,-1,5-tr-16659036", 
    "https://www.hemnet.se/bostad/lagenhet-2rum-lilla-essingen-kungsholmen-stockholms-kommun-stralgatan-23,-4-tr-16759892"
]

function scrapeInfo(url, scrapingMethod) {
    let result = []
    request(url, async (error, response, html) => {
        if (!error && response.statusCode === 200) {
            const $ = cheerio.load(html)
            //listingLinks = getListingsLink($)
            result = scrapingMethod($)
            console.log(result)
        }
    })
    return result
}

const getListingsLink = ($) => {
    const listings = $('.js-listing-card-link.listing-card')
    let filteredListings = []
    listings.each((index, listing) => {
        let link = $(listing).attr('href')
        filteredListings.push(link)
    })
    return filteredListings
}

const getListingsInfo = async (listingsLinks, getSpecificPageInfoMethod) => {
    const allListingsInfo = await Promise.all(listingsLinks.map(async (link, index) => {
        //const listingInfo = await getPageListingInfo(link)
        const id = generateIdFromUrl({"url": link})
        const listingInfo = await getSpecificPageInfoMethod(link)
        const result = {[id]: listingInfo}
        console.log("Done with one property:", result)
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

async function getPageListingInfo(hemnet_listing_url) {
    return new Promise((resolve, reject) => {
        request(hemnet_listing_url, (error, response, html) => {
            if (!error && response.statusCode === 200) {
                const $ = cheerio.load(html)
                console.log('LOADED DETAILED PAGE for ', hemnet_listing_url)
                //Get text-info
                const street = $('.property-address__street.qa-property-heading').text()
                const area = $('.property-address__area').text()
                const startPrice = $('.property-info__price.qa-property-price').text()
                const tableInfo = {}
                $('.property-attributes-table__row').each(function (i, el) {
                    const title = $(this).find('.property-attributes-table__label').text().trim()
                    if (title.length < 1)
                        return
                    const titleEnglish = translator.translate(title)
                    const value = $(this).find('.property-attributes-table__value').text().trim().split('\n')[0]
                    tableInfo[titleEnglish] = value
                })

                //Combine everything
                const propertyInfo = {
                    "originalUrl": hemnet_listing_url,
                    "street": street,
                    "area": area,
                    "startPrice": startPrice,
                    ...tableInfo,
                }
                //DONE
                resolve(propertyInfo);
            }else{
                reject(error)
            }
        })
    }) 
}

async function getPageListingImages(listingLinks) {
    const sc = scraper()
    await sc.launch()
    console.log('launched headless scraper')
    
    //DO THIS FOR ALL
    const listingsImage = await getListingsInfo(listingLinks, async (link) => await sc.getListingImagesHemnet(link))

    console.log('shuttingdown the headless scraper')
    await sc.shutdown();
    return listingsImage;
}

/** Main function to get info from listings
 *  Provide options for the listing search on Hemnet. Such as url, max-price...
*/
async function getListings(options) {
    const listingsURL = 'https://www.hemnet.se/bostader?location_ids%5B%5D=898741&item_types%5B%5D=bostadsratt&rooms_min=2&living_area_min=30&price_min=1750000&price_max=3500000';
    //const listingLinks = scrapeInfo(listingsURL, ($) => getListingsLink($))
    let listingLinks =  testListings

    const listingsInfo = getListingsInfo(listingLinks, async (link) => await getPageListingInfo(link))
    const listingsImage = getPageListingImages(listingLinks)

    //TODO: Combine everything
    const [doneInfo, doneImages] = await Promise.all([listingsInfo, listingsImage])
    const combinedListings = mergeDeep(doneInfo, doneImages)

    console.log('ListingsInfo: ', combinedListings)
}

function generateIdFromUrl(options) {
    //https://www.hemnet.se/bostad/lagenhet-2rum-ostermalm-vasastan-stockholms-kommun-valhallavagen-69-16700740
    //Should as of now get slug after last '/' -> lagenhet-2rum-ostermalm-vasastan-stockholms-kommun-valhallavagen-69-16700740
    const url = URL.parse(options.url)
    const slugs = url.pathname.split('/')
    const lastSlug = slugs[slugs.length - 1];
    return lastSlug
}

async function test(){
    //const listingLinks = testListings
    //const result = await getListingsInfo(listingLinks, async (link) => await getPageListingInfo(link))
    //const result = await getListingsInfo(listingLinks, async (link) => await getPageListingImages(link))
    //const result = await getPageListingImages(listingLinks)
    //console.log('Result of test is', result)

    // const x = {"1": {"a": "hej"}, "2":{"a": "hej"}}
    // const y = {"1": {"b": "san"}, "2":{"b": "san"}}
    // console.log(mergeDeep(x, y))

    getListings();
}
test();

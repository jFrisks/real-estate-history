const request = require('request')
const cheerio = require('cheerio')
const translator = require('./translator')()
const scraper = require('./scraper')
const URL = require('url');

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
    let listings = {}
    //TODO: REWRITE O EACH AND SAVE IN LISTINGS AS {id1: {}, id2: {}, id3: {}}
    const allListingsInfo = await Promise.all(listingsLinks.map(async (link, index) => {
        //const listingInfo = await getPageListingInfo(link)
        const id = generateID({"url": link})
        const listingInfo = await getSpecificPageInfoMethod(link)
        const result = {[id]: listingInfo}
        console.log("Done with one property:", result)
        return result
    }));
    //console.log(allListingsInfo)
    return allListingsInfo;
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

async function getListings(options) {
    /** Main function to get info from listings
     *  Provide options for the listing search on Hemnet. Such as url, max-price...
     *  
    */
    const listingsURL = 'https://www.hemnet.se/bostader?location_ids%5B%5D=898741&item_types%5B%5D=bostadsratt&rooms_min=2&living_area_min=30&price_min=1750000&price_max=3500000';
    const listingLinks = scrapeInfo(listingsURL, ($) => getListingsLink($))
    // let listingLinks =  [
    //     "https://www.hemnet.se/bostad/lagenhet-2rum-ostermalm-vasastan-stockholms-kommun-valhallavagen-69-16700740", 
    //     "https://www.hemnet.se/bostad/lagenhet-2rum-sofia-stockholms-kommun-erstagatan-30-16712395"
    // ]

    const listingsInfo = await getListingsInfo(listingLinks, async (link) => await getPageListingInfo(link))
    console.log('ListingsInfo: ', listingsInfo)
    //const listingsImage = await getPageListingImages(listingLinks)

    //TODO: Combine everything
}

function generateID(options) {
    //https://www.hemnet.se/bostad/lagenhet-2rum-ostermalm-vasastan-stockholms-kommun-valhallavagen-69-16700740
    //Should as of now get slug after last '/' -> lagenhet-2rum-ostermalm-vasastan-stockholms-kommun-valhallavagen-69-16700740
    const url = URL.parse(options.url)
    const slugs = url.pathname.split('/')
    const lastSlug = slugs[slugs.length - 1];
    return lastSlug
}

async function test(){
    //const listingLinks = ["https://www.hemnet.se/bostad/lagenhet-2rum-kungsholmen-essingeoarna-stockholms-kommun-stenshallsvagen-13-16672980"]
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

/**
 * TODO:
 * - Check on solution to instead create a chrome extension for hemnet. Saving images and info of "hearted" listings
 * - If each image takes 80kb -> 100mb is 1250 images. -> 25 images/listing -> 50 listings -> Takes a lot of space for hosting on server...
 */
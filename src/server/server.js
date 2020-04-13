const request = require('request')
const cheerio = require('cheerio')
const translator = require('./translator')("swedish")
const scraper = require('./scraper')
const URL = require('url');
const { mergeDeep, generateIdFromUrl } = require('./utils');


function getFilteredListingsURL(options){
    //TODO: get params to filter search
    const listingsURL = 'https://www.hemnet.se/bostader?location_ids%5B%5D=898741&item_types%5B%5D=bostadsratt&rooms_min=2&living_area_min=30&price_min=1750000&price_max=3500000';
    const listingLinks = scrapeInfo(listingsURL, ($) => getListingsLink($));
    return listingLinks;
}

function scrapeInfo(url, scrapingMethod) {
    let result = []
    request(url, async (error, response, html) => {
        if (!error && response.statusCode === 200) {
            const $ = cheerio.load(html)

            //Normally getListingsLink methods is passed as scrapingMethod
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

/** Main function to get info from listings
 *  Provide options for the listing search on Hemnet. Such as url, max-price...
*/
async function getListings(listingLinks) {
    const listingsInfo = getListingsInfo(listingLinks, async (link) => await getPageListingInfo(link))
    const listingsImage = getPageListingImages(listingLinks)

    //TODO: Combine everything
    const [doneInfo, doneImages] = await Promise.all([listingsInfo, listingsImage])
    const combinedListings = mergeDeep(doneInfo, doneImages)

    console.log('ListingsInfo: ', combinedListings)
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

module.exports = {
    getListings,
    getListingsInfo,
    getPageListingInfo,
    getPageListingImages,
    getFilteredListingsURL,
}
const request = require('request')
const cheerio = require('cheerio')
const translator = require('./translator')()

const getListingsLink = ($) => {
    const listings = $('.js-listing-card-link.listing-card')
    let filteredListings = []
    listings.each((index, listing) => {
        let link = $(listing).attr('href')
        filteredListings.push(link)
    })
    return filteredListings
}

const getListingInfo = async (hemnet_listing_url) => {
    const listingInfo = await getPageListingInfo(hemnet_listing_url)
    return listingInfo;
}

async function getPageListingInfo(hemnet_listing_url) {
    return new Promise((resolve, reject) => {
        request(hemnet_listing_url, (error, response, html) => {
            if (!error && response.statusCode === 200) {
                const $ = cheerio.load(html)
                console.log('LOADED DETAILED PAGE for ', hemnet_listing_url)
                //TODO: get photos, street name, info, price ...
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
                const propertyInfo = {
                    "street": street,
                    "area": area,
                    "startPrice": startPrice,
                    ...tableInfo
                }
                resolve(propertyInfo);
            }else{
                reject(error)
            }
        })
    }) 
}

function getListings() {
    const url = 'https://www.hemnet.se/bostader?location_ids%5B%5D=898741&item_types%5B%5D=bostadsratt&rooms_min=2&living_area_min=30&price_min=1750000&price_max=3500000';

    request(url, async (error, response, html) => {
        if (!error && response.statusCode === 200) {
            const $ = cheerio.load(html);
            let listingLinks = getListingsLink($);
            // let listingLinks =  [
            //     "https://www.hemnet.se/bostad/lagenhet-2rum-ostermalm-vasastan-stockholms-kommun-valhallavagen-69-16700740", 
            //     "https://www.hemnet.se/bostad/lagenhet-2rum-sofia-stockholms-kommun-erstagatan-30-16712395"
            // ]
            console.log(listingLinks)

            const listings = await Promise.all(listingLinks.map(async (link, index) => {
                const listingInfo = await getListingInfo(link)
                console.log("Done with one property:", listingInfo)
                return listingInfo
            }));
            console.log(listings)
        }
    });

}

//getListingInfo("https://www.hemnet.se/bostad/lagenhet-2rum-kungsholmen-essingeoarna-stockholms-kommun-stenshallsvagen-13-16672980")
getListings();
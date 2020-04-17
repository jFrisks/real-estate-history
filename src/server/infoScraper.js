const cheerio = require('cheerio');
const translator = require('./translator')("swedish");
const { requestWithPromise } = require('./utils');

function infoScraper(){

    async function scrapeInfo(url, scrapingMethod) {
        return await requestWithPromise(url, (html) => {
            const $ = cheerio.load(html)
        
            //Normally getListingsLink methods is passed as scrapingMethod
            let result = scrapingMethod($)
            console.log(result)
            return result;
        });
    }
    
    //TODO: optimize defining how many links to take
    const getListingsLink = ($) => {
        const listings = $('.js-listing-card-link.listing-card')
        let filteredListings = []
        listings.each((index, listing) => {
            let link = $(listing).attr('href')
            filteredListings.push(link)
        })
        return filteredListings
    }
    
    async function getPageListingInfo(hemnet_listing_url) {
        return await requestWithPromise(hemnet_listing_url, (html) => {
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
            return propertyInfo;
        })
    }

    return {
        scrapeInfo,
        getListingsLink,
        getPageListingInfo
    }
}
module.exports = infoScraper;
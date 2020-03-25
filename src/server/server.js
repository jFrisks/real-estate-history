const request = require('request')
const cheerio = require('cheerio')
const translator = require('./translator')()
const getListingInfo = (hemnet_listing_url) => {
    request(hemnet_listing_url, (error, response, html) => {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
            console.log('LOADED DETAILED PAGE for ', hemnet_listing_url)
            
            //TODO: get photos, street name, info, price ...
            const street = $('.property-address__street.qa-property-heading').text();
            const area = $('.property-address__area').text();
            const startPrice = $('.property-info__price.qa-property-price').text();
            const tableInfo = {}
            $('.property-attributes-table__row').each(function(i, el) {
                const title = $(this).find('.property-attributes-table__label').text().trim()
                if(title.length < 1) return

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
            return propertyInfo
        }
    });
}

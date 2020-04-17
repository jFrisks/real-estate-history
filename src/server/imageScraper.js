const puppeteer = require('puppeteer');

function scraper(){
    let browser;

    const launch = async () => {
        browser = await puppeteer.launch();
        return browser;
    }

    const shutdown = async () => {
        return await browser.close();
    }

    /** Gets images for one listing.
     *  Returns {"images": [link1, link2, ...]} or throws error if rejected
    */
    const getListingImagesHemnet = async (url) => {
        try{
            const page = await browser.newPage();
            page.on('error', (err) => {
                console.error('error on page', err)
            })
            page.on('pageerror', (err) => {
                console.error('error on page', err)
            })

            await page.goto(url);
            console.log('Headless scraper visited page ', url)
            
            //find amount of images
            const moreImagesButton = await page.$('.property-gallery__button.qa-all-images-link.property-gallery__button.property-gallery__button--icon-right span')
            const moreImagesButtonLabel = await page.evaluate(el => el.innerText, moreImagesButton);
            const amountImages = parseInt(moreImagesButtonLabel.split(' ')[0])
            
            //click the same amount as images. This will load all slides.
            console.log('Headless scraper starting to click next button ' + amountImages + ' times')
            for (let i = 0; i < amountImages; i++) {
                //click that amount on next-arrow
                const nextImageButton = await page.$('.gallery-carousel__button.gallery-carousel__button--next')
                await nextImageButton.click()
            }
            console.log('Headless scraper done clicking')
            
            //selectAllImages and save
            const imageElements = await page.$$('.gallery-carousel__image-touchable img')
            const imageLinks = []
            
            for(let i = 0; i < imageElements.length; i++){
                const link = await page.evaluate(el => el.src, imageElements[i]);
                imageLinks.push(link)
            }
            console.log('Headless scraper has collected all image src')
            await page.close();

            const imagesObject = {"images": imageLinks}
            return imagesObject;
        }catch(err){
            return console.error(err);
        }
    };

    return {
        launch,
        shutdown,
        getListingImagesHemnet,
    }
}
    
module.exports = scraper;
const puppeteer = require('puppeteer');

function scraper(){
    let browser;

    const launch = async () => {
        browser = await puppeteer.launch();
    }

    const shutdown = async () => {
        await browser.close();
    }

    const getListingImagesHemnet = async (url) => {
        
        const page = await browser.newPage();
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

        const imagesObject = {"images": imageLinks}
        return imagesObject;
    };

    return {
        launch,
        shutdown,
        getListingImagesHemnet,
    }
}
    
module.exports = scraper;
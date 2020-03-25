const puppeteer = require('puppeteer');


const getListingImagesHemnet = async (url) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    //find amount of images
    const moreImagesButton = await page.$('.property-gallery__button.qa-all-images-link.property-gallery__button.property-gallery__button--icon-right span')
    const moreImagesButtonLabel = await page.evaluate(el => el.innerText, moreImagesButton);
    const amountImages = parseInt(moreImagesButtonLabel.split(' ')[0])

    //click the same amount as images. This will load all slides.
    for (let i = 0; i < amountImages; i++) {
        //click that amount on next-arrow
        const nextImageButton = await page.$('.gallery-carousel__button.gallery-carousel__button--next')
        await nextImageButton.click()
    }

    //selectAllImages and save
    const imageElements = await page.$$('.gallery-carousel__image-touchable img')
    const imageLinks = []

    for(let i = 0; i < imageElements.length; i++){
        const link = await page.evaluate(el => el.src, imageElements[i]);
        imageLinks.push(link)
    }

    await browser.close();
    return imageLinks;
};

module.exports = {
    getListingImagesHemnet
};
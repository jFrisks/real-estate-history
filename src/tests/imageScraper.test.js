const imageScraper = require('../server/imageScraper');
const sc = imageScraper();

beforeEach(async () => {
    jest.setTimeout(10000);
    return await sc.launch();
});

afterEach(async () => {
    return await sc.shutdown();
});

test('scrape images and get array of image links', async () => {
    const url = "https://www.hemnet.se/bostad/lagenhet-2rum-sodermalm-tanto-stockholms-kommun-tantogatan-59,-4-tr-16744682";
    const images = await sc.getListingImagesHemnet(url);
    console.log(images);
    expect(images).toBeDefined()
    expect(images.images[0]).toEqual(
        expect.stringMatching(/hemnet\.se/)
    )
    return images;
})
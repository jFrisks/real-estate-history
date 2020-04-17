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
    const url = "https://www.hemnet.se/bostad/lagenhet-2rum-kristinebergs-strand-stockholms-kommun-olof-dalins-vag-18-16771657";
    const images = await sc.getListingImagesHemnet(url);
    console.log(images);
    expect(images).toBeDefined()
    expect(images.images[0]).toEqual(
        expect.stringMatching(/hemnet\.se/)
    )
    return images;
})
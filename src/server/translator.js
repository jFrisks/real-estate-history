const translations = {
    english: {

    },
    swedish: {
        "hej": "hi",
        "antal rum": "rooms",
        "avgift": "rent",
        "balkong": "balcony",
        "boarea": "livingSpace",
        "bostadstyp": "propertyType",
        "byggår": "buildYear",
        "driftkostnad": "operatingCost",
        "förening": "housingSociety",
        "pris/m²": "pricePerSquareMeter",
        "pris/m2": "pricePerSquareMeter",
        "upplåtelseform": "tenure",
        "våning": "floor"
    }
}

function translator(dict = "swedish") {
    const language = dict;
    //ensure lower case
    //error handling

    //get correct tranlsation
    function translate(word){
        const wordLower = word.toLowerCase();
        const translation = translations[language][wordLower]
        if (!translation){
            console.error("No translation for", word)
            return wordLower;
        }
        return translation
    }

    return {
        translate
    }
}
module.exports = translator
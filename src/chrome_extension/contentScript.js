'use strict';

console.log('RealEstateHistory - Load contentcript')
const unlikeButtonClassName = "save-listing__button--saved"
const likeAction = "likeButtonClicked"
const unlikeAction = "unlikeButtonClicked"

window.addEventListener("load", function(event) { 
    console.log('RealEstateHistory - Page loaded fully')

    //WHEN LIKE/UNLIKE-BUTTON CLICKED
    let likeUnlikeButton = document.querySelector('.property-gallery__button--first');
    var checkExist = setInterval(function() {
        likeUnlikeButton = document.querySelector('.property-gallery__button--first');
        if (likeUnlikeButton) {
           console.log("Like button found!");
           likeUnlikeButton.addEventListener('click', () => handleClickLikeUnlike(), false)
           clearInterval(checkExist);
        }
     }, 100); // check every 100ms

    function handleClickLikeUnlike(){
        //check if liked or unliked
        const isUnliked = likeUnlikeButton.children[0].classList.contains(unlikeButtonClassName)
        let action = isUnliked ? unlikeAction : likeAction

        const message = {
            action,
            url: window.location.href
        }
        
        //console.log('Extension registered like/unlike')
        //send message to extension
        chrome.runtime.sendMessage(undefined, message, undefined, function(responseMessage){
            //calback
            if(!responseMessage)
                console.error(chrome.runtime.lastError)
            //console.log(responseMessage)
        })

    }
});

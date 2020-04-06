'use strict';

console.log('RealEstateHistory - Load contentcript')
const unlikeButtonClassName = "save-listing__button--saved"
const likeAction = "likeButtonClicked"
const unlikeAction = "unlikeButtonClicked"

window.addEventListener("load", function(event) { 
    console.log('RealEstateHistory - Page loaded fully')


    //WHEN LIKE/UNLIKE-BUTTON CLICKED
    let likeUnlikeButton = document.getElementsByClassName('property-gallery__button--first')[0];
    likeUnlikeButton.addEventListener('click', function(){
        //check if liked or unliked
        const isUnliked = likeUnlikeButton.children[0].classList.contains(unlikeButtonClassName)
        let action = isUnliked ? unlikeAction : likeAction

        const message = {
            action
        }
        
        //send message to extension
        chrome.runtime.sendMessage(undefined, message, undefined, function(responseMessage){
            //calback
            console.log(responseMessage)
        })

    }, false);
});

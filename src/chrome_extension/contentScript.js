'use strict';

console.log('RealEstateHistory - Load contentcript')

window.addEventListener("load", function(event) { 
    console.log('RealEstateHistory - Page loaded fully')

    //do work
    let likeButton = document.getElementsByClassName('property-gallery__button--first')[0];
    likeButton.addEventListener('click', function(){
        alert('hello, clicked button')
    }, false);
  });

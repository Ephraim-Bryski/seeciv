// function to modify underbrace text:
function changeUnderText(underTextIndex,value,numOfDec){
    // underTextIndex: underbrace you want to modify, input 1 for the first underbrace
    // value: value you want for underbrace 
    // numOfDec: number of decimals you want displayed


    // get the element with the desired text:
    textSpan=document.getElementsByClassName("mjx-under")[(underTextIndex-1)*2+1].children[0].children[0].children[0].children[0]
    
    // round the value:
    roundedValue=Math.round(value*(10**numOfDec))/(10**numOfDec)

    // set the text to the rounded value:
    textSpan.innerText=roundedValue

}
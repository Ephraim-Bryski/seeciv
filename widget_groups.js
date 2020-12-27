function  makeSliderGroup(parent,xRel,yRel,labelText,length,orientation,range,initialVal,updateFunction,thumbColor="#333",makeSlider=true,stepSpinner=1){    // xRel and yRel should be strings with the percentage relative position in parent from left and top
   //! add range as input
   // If I start wanting to add more optional inputs, I could just make a class and make them attributes
    var width=30                                                                        // just adjust to get the slider in a nice position
    if (orientation.localeCompare("vertical")==0){                                      // 0 means it's equal (JavaScript is stupid)
        var moveSliderString=("translateY(").concat((length-width)/2).concat("px) translateX(").concat((width-length)/2).concat("px) rotate(-90deg)")
        var moveSpinnerString=("translateY(").concat(length-width+5).concat("px)")      // 5 is just to give a bit of space (not needed)
        var displayType="block"
        var alignLabel="left"
    }else if (orientation.localeCompare("horizontal")==0){
        var moveSliderString="translateY(10px)"                                         // just to center the slider a bit (not needed)
        var moveSpinnerString=""
        var displayType="inline-block"
        var alignLabel="right"
    }


    var container=document.createElement("div")
    Object.assign(container.style,{
        left: xRel,
        top: yRel
    })

    var label=document.createElement("div")
    label.innerHTML=labelText
    Object.assign(label.style,{
        position: "static",
        width: "100px",
        display: displayType,
        color: "white",
        textAlign: alignLabel
    })


    var sliderElement=document.createElement("input")
    sliderElement.type="range"
    sliderElement.classList.add("slider")
    sliderElement.style.setProperty("--c",thumbColor)
    sliderElement.min=range[0]
    sliderElement.max=range[1]
    sliderElement.oninput=function(){updateInputs(this.value)}
    sliderElement.value=initialVal
    sliderElement.step=0.001
    Object.assign(sliderElement.style,{
        position: "static",
        width: length.toString().concat("px"),
        height: width.toString().concat("px"),
        transform: moveSliderString,
        display: displayType
    })

    //! add constraint on spinner
    var spinnerElement=document.createElement("input")
    spinnerElement.type="number"
    spinnerElement.value=initialVal
    spinnerElement.step=stepSpinner
    spinnerElement.oninput=function(){updateInputs(this.value)}
    Object.assign(spinnerElement.style,{
        position: "static",
        width: "50px",
        transform: moveSpinnerString,
        display: displayType
    })



    parent.appendChild(container)
    container.appendChild(label)
    if(makeSlider){container.appendChild(sliderElement)}
    container.appendChild(spinnerElement)

    return container

    function updateInputs(val){
        sliderElement.value=val
        spinnerElement.value=val
        
        updateFunction(val)
    }
}

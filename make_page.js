function makePage(labels,makeVisual){
  // sets initial stage to 0:
  var stage=0 

  //#region <sets dimensions for page layout>

  var verSplit=0.3                    // from left
  var horSplit=0.05                   // from bottom

  var textWidth=0.9                   // fraction of text box which fills up leftDiv
  var textBottomSpace=0.1             // relative distance between bottom of text box and bottom of leftDiv
  var textTopSpace=0.1               // relative distance between top of text box and top of leftDiv

  var titleFromTop=0.05               // relative distance between top of title and top of leftDiv
  var backFwdBtnsFromBottom=0.05       // relative distance between bottom of the back/forward buttons and bottom of leftDiv
  //#endregion
 
  //#region <create and position divs>
    //#region <children of body>
    var leftDiv=document.createElement("div")
    leftDiv.classList.add("text-box")
    Object.assign(leftDiv.style,{
        width:(verSplit*100).toString().concat("%"),
        height: (100-horSplit*100).toString().concat("%"),
    })
    
    

    var rightDiv=document.createElement("div")
    rightDiv.classList.add("graph")
    Object.assign(rightDiv.style,{
        width:(100-verSplit*100).toString().concat("%"),
        height: (100-horSplit*100).toString().concat("%"),
        right: "0%"
    })
    rightDiv.innerText="Ctrl+Click to Orbit"


    var stageBtns=document.createElement("div")
    Object.assign(stageBtns.style,{
        width: "100%",
        height: (horSplit*100).toString().concat("%"),
        bottom: 0
    })    

      //#region <children of leftDiv>
      var textDiv=document.createElement("div")
      Object.assign(textDiv.style,{
          width:((textWidth*100).toString().concat("%")),
          height: (100-(textTopSpace+textBottomSpace)*100).toString().concat("%"),
          top: (textTopSpace*100).toString().concat("%"),
          left: (50-(textWidth*100)/2).toString().concat("%")
      })

      var titleDiv=document.createElement("div")
      Object.assign(titleDiv.style,{
          top: (100*titleFromTop).toString().concat("%"),
          width: "100%",
          textAlign: "center",
          display: "block",
          fontSize: 30
      })
      titleDiv.innerText="The Title is Not Displaying ):"

      var backFwdBtns=document.createElement("div")
      Object.assign(backFwdBtns.style,{
          bottom: (100*backFwdBtnsFromBottom).toString().concat("%"),
          width: "100%",
          textAlign: "center"
      })

      //#region <children of BackFwdBtns>

        var backBtn=document.createElement("button")
        backBtn.classList.add("back-fwd-btn")
        backBtn.classList.add("tooltip")
        backBtn.innerHTML="&#8249;&nbsp"
        backBtn.onclick=function(){
          stage-=1
          changeStage()
        }

        var backBtnToolTip=document.createElement("div")
        backBtnToolTip.classList.add("tooltiptext")
        backBtnToolTip.innerText="Back to Previous Step"
        backBtn.appendChild(backBtnToolTip)

        var fwdBtn=document.createElement("button")
        fwdBtn.innerHTML="&nbsp&#8250;"
        fwdBtn.classList.add("back-fwd-btn")
        fwdBtn.classList.add("tooltip")
        fwdBtn.onclick=function(){
          stage+=1
          changeStage()
        }

        var fwdBtnToolTip=document.createElement("div")
        fwdBtnToolTip.classList.add("tooltiptext")
        fwdBtnToolTip.innerText="Forward to Next Step"
        fwdBtn.appendChild(fwdBtnToolTip)
        //#endregion
      //#endregion
    //#endregion
  //#endregion

  //#region <appends stage buttons>
  for (let i = 0; i < labels.length; i++){
      var btn=document.createElement("button")
      btn.innerHTML=labels[i]
      btn.classList="stage-btn"
      Object.assign(btn.style,{
        width: (100/labels.length).toString().concat("%")
      })
      btn.onclick=function(){
        stage=i
        changeStage()
      }
      stageBtns.appendChild(btn)
  }
  //#endregion

  //#region <append all other divs>
  document.body.appendChild(leftDiv)
  document.body.appendChild(rightDiv)
  document.body.appendChild(stageBtns)
  leftDiv.appendChild(textDiv)
  leftDiv.appendChild(titleDiv)
  leftDiv.appendChild(backFwdBtns)
  backFwdBtns.appendChild(backBtn)
  backFwdBtns.appendChild(fwdBtn)
  

  //#endregion

  //starts by making visual and changing to stage 0:
  makeVisual(textDiv,rightDiv)
  changeStage()
  //makeVisual.setValues()

  function changeStage() {

    makeVisual.changeStageGraphic(stage)
    
    //#region <change stage buttons and title>
    
    // get buttons:
    var buttons=document.getElementsByClassName("stage-btn")
    var selBtn=buttons[stage]

    // change title:
    titleDiv.innerHTML=selBtn.innerHTML

    // modify buttons:
    for (let i = 0; i < labels.length; i++) { 
        buttons[i].classList.remove("active")
    }
    
    selBtn.classList.add("active")
     
    if (stage==0){
      backBtn.disabled=true
    }else{
      backBtn.disabled=false
    }
    if (stage==labels.length-1){
      fwdBtn.disabled=true
    }else{
      fwdBtn.disabled=false
    }
    //#endregion
  }  
}


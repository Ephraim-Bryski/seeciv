/*
collection of short useful functions
*/

// function to modify underbrace text:
function changeUnderText(underTextIndex,value,numOfDec,parent=document){
    // underTextIndex: underbrace you want to modify, input 1 for the first underbrace
    // value: value you want for underbrace 
    // numOfDec: number of decimals you want displayed
    // parent: the div to search for the underbraces, optional 


    // get the element with the desired text:

    textSpan=parent.getElementsByClassName("mjx-under")[(underTextIndex-1)*2+1].children[0].children[0].children[0].children[0]
    
    // round the value:
    roundedValue=Math.round(value*(10**numOfDec))/(10**numOfDec)

    // set the text to the rounded value:
    textSpan.innerText=roundedValue

} 

// changes the opacity of all shapes in an array (or nested array), called in branches when changing opacity
function changeOpacity(shapeGroups,opacitySel){
    var allShapes=shapeGroups.flat(Infinity)
    for (let i=0;i<allShapes.length;i++){
        var shape=allShapes[i]
        shape.opacity=opacitySel
    }
}

function changeVisibility(shapeGroups,isVisible){
    var allShapes=shapeGroups.flat(Infinity)
    for (let i=0;i<allShapes.length;i++){
        var shape=allShapes[i]
        shape.visible=isVisible
    }
}


function linspace(startValue, stopValue, cardinality) {
    var arr = [];
    var step = (stopValue - startValue) / (cardinality - 1);
    for (var i = 0; i < cardinality; i++) {
        arr.push(startValue + (step * i));
    }
    return arr;
}
  
function vecToMat(pointsV){
    var pointsM=[]
    for (let  i=0;i<pointsV.length;i++){
        pointsM[i]=[]
        pointsM[i][0]=pointsV[i].x
        pointsM[i][1]=pointsV[i].y
        pointsM[i][2]=pointsV[i].z
    }
    return pointsM
}
function matToVec(pointsM){
    var pointsV=[]
    for (let i=0;i<pointsM.length;i++){
        pointsV[i]=vec(0,0,0)
        pointsV[i].x=pointsM[i][0]
        pointsV[i].y=pointsM[i][1]
        pointsV[i].z=pointsM[i][2]
    }
    return pointsV
}

function makeCoordShape(coordShapePos=vec(0,0,0),coordShapeScale=1){
    
    var coordTextGap=.1

    var xDir=arrow({axis:vec(1,0,0).multiply(coordShapeScale),pos:coordShapePos})
    var yDir=arrow({axis:vec(0,1,0).multiply(coordShapeScale),pos:coordShapePos})
    var zDir=arrow({axis:vec(0,0,1).multiply(coordShapeScale),pos:coordShapePos})


    var xText=label({text:"x",pos:vec(1+coordTextGap,0,0).multiply(coordShapeScale).add(coordShapePos), box: false, opacity: 0})
    var yText=label({text:"y",pos:vec(0,1+coordTextGap,0).multiply(coordShapeScale).add(coordShapePos), box: false, opacity: 0})
    var zText=label({text:"z",pos:vec(0,0,1+coordTextGap).multiply(coordShapeScale).add(coordShapePos), box: false, opacity: 0})

    var coordShape=[xDir,yDir,zDir,xText,yText,zText]
    
    return coordShape

}
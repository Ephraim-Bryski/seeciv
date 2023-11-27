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


var graphDiv = document.getElementById("vis")
window.__context= {glowscript_container: graphDiv}  
let scene=canvas({width: graphDiv.offsetWidth,height: graphDiv.offsetHeight,resizable: true,userzoom: true,autoscale: true})


makeYourGraphics(1,2,0,0,5,0,1,-0.2,0,0.1,0,0)
// You can also create an array for the text in the text box and refer to it in the changeStageGraphics method
function makeYourGraphics(stress_xx,stress_yy,stress_zz,stress_xy,stress_xz,stress_yz,strain_xx,strain_yy,strain_zz,strain_xy,strain_xz,strain_yz){
    

    //#region <Create GlowScript graphics and combine in array>

    
    var colors=[vec(1,0,0),vec(0,1,0),vec(0,0,1),
                vec(0,1,1),vec(1,0,1),vec(1,1,0)]

    var scale=8



    //! initializes box, remove
    var box0=[]
    var boxP=[]
    for (let i=0;i<6;i++){
        var vertices=[]
        var verticesP=[]
        for (let j=0;j<4;j++){
            vertices[j]=vertex({pos: vec(0,0,0), opacity: 0.5})
            verticesP[j]=vertex({pos: vec(0,0,0), opacity: 1})
        }
        box0[i]=quad({vs: vertices})
        boxP[i]=quad({vs: verticesP})
    }

    //! initializes arrows, remove
    var arrowsN=[]
    for (let i=0;i<6;i++){arrowsN[i]=arrow({pos: vec(0,0,0),axis: vec(0,0,0), color: colors[floor(i/2)]})}
    var arrowsV=[]
    for (let i=0;i<12;i++){arrowsV[i]=arrow({pos: vec(0,0,0),axis: vec(0,0,0), color: colors[floor(i/4)+3]})} 



    var points=[
    vec(-1,-1,-1),
    vec(1,-1,-1),
    vec(1,-1,1),
    vec(-1,-1,1),
    vec(-1,1,-1),
    vec(1,1,-1),
    vec(1,1,1),
    vec(-1,1,1)]


    var midPoints=[
    vec(-1,0,0),
    vec(1,0,0),
    vec(0,-1,0),
    vec(0,1,0),
    vec(0,0,-1),
    vec(0,0,1)]

    var faces=[[0,1,5,4]
    ,[1,2,6,5]
    ,[2,3,7,6]
    ,[3,0,4,7]
    ,[3,2,1,0]
    ,[4,5,6,7]]


    //#region 




    var M=[[stress_xx,stress_xy,stress_xz],[stress_xy,stress_yy,stress_yz],[stress_xz,stress_yz,stress_zz]]

    
    const unit =
        [[1,0,0],
        [0,1,0],
        [0,0,1]]

    const strain = 
        [[strain_xx,strain_xy,strain_xz],
        [strain_xy,strain_yy,strain_yz],
        [strain_xz,strain_yz,strain_zz]]
    
    const sv = [[stress_xx],[stress_yy],[stress_zz]]

    const disp = math.add(unit, strain)


    // gets deformed coordinates, keep
    //! need to cmpute disp
    var pointsM=vecToMat(points)
    var midPointsM=vecToMat(midPoints)
    
    var pointsNM=math.transpose(math.multiply(disp,math.transpose(pointsM)))
    var midPointsNM=math.transpose(math.multiply(disp,math.transpose(midPointsM)))
    var vx=math.subtract(pointsNM[1],pointsNM[0])
    var vy=math.subtract(pointsNM[4],pointsNM[0])
    var vz=math.subtract(pointsNM[3],pointsNM[0])

    var vnM=math.transpose([vx,vy,vz])

 
    //! create boxes instead of modifiying them
    changeBox(box0,pointsM)
    changeBox(boxP,pointsNM)
    function changeBox(box,points){
        var pointsV=matToVec(points)

        for (let i=0;i<6;i++){
            var vertices=[]
            var sidePoints=[];for(let j=0;j<4;j++){sidePoints[j]=pointsV[faces[i][j]]}

            var a=sidePoints[0];var b=sidePoints[1];var c=sidePoints[2]

            var lightNorm=a.sub(b).cross(c.sub(b)).norm()

            for (let j=0;j<4;j++){
                box[i].vs[j].pos=pointsV[faces[i][j]]
                box[i].vs[j].normal=lightNorm
            }
        }


    }

    // computes the arrow direction after displacement (direction is changed to adjust for it)
    var snM=math.dotMultiply(math.identity(3)._data,math.transpose(Array(3).fill(math.transpose(sv).flat())))
    var snMp=math.multiply(disp,snM)

    // all of this is for arrows: 

    //! create the arrows instead of modifying them
    for (let i=0;i<3;i++){

        var snvp=math.transpose(snMp)[i]
        if (math.norm(snvp)!=0){var usnvp=math.divide(snvp,math.norm(snvp))}
        else{var usnvp=snvp}
        var arrowStart=math.transpose(midPointsNM[2*i+1])
        var arrowAxis=math.multiply(usnvp,sv[i]/scale)

        if (snvp[i]<0){
            arrowStart=math.add(arrowStart,arrowAxis)
            arrowAxis=math.multiply(arrowAxis,-1)
        }

        arrowStartV=vec(arrowStart[0],arrowStart[1],arrowStart[2])
        arrowAxisV=vec(arrowAxis[0],arrowAxis[1],arrowAxis[2])


        arrowsN[2*i].pos=arrowStartV
        arrowsN[2*i].axis=arrowAxisV
        arrowsN[2*i+1].pos=arrowStartV.multiply(-1)
        arrowsN[2*i+1].axis=arrowAxisV.multiply(-1)
        

        for (let j=i+1;j<3;j++){
            
            

            var tau=M[i][j]


            var vn=math.transpose(vnM)[j]
            if (math.norm(vn)!=0){var uvn=math.divide(vn,math.norm(vn))}
            else{var uvn=vn}

            var arrowStart=math.subtract(math.transpose(midPointsNM[2*i+1]),math.multiply(uvn,tau/(2*scale)))
            var arrowAxis=math.multiply(uvn,tau/scale)
            var arrowStartV=vec(arrowStart[0],arrowStart[1],arrowStart[2])
            var arrowAxisV=vec(arrowAxis[0],arrowAxis[1],arrowAxis[2])
        

            arrowsV[4*(i+j-1)].pos=arrowStartV
            arrowsV[4*(i+j-1)].axis=arrowAxisV
            arrowsV[4*(i+j-1)+1].pos=arrowStartV.multiply(-1)
            arrowsV[4*(i+j-1)+1].axis=arrowAxisV.multiply(-1)





            vn=math.transpose(vnM)[i]
            if (math.norm(vn)!=0){uvn=math.divide(vn,math.norm(vn))}
            else{uvn=vn}

            var arrowStart=math.subtract(math.transpose(midPointsNM[2*j+1]),math.multiply(uvn,tau/(2*scale)))
            var arrowAxis=math.multiply(uvn,tau/scale)
            var arrowStartV=vec(arrowStart[0],arrowStart[1],arrowStart[2])
            var arrowAxisV=vec(arrowAxis[0],arrowAxis[1],arrowAxis[2])


            arrowsV[4*(i+j-1)+2].pos=arrowStartV
            arrowsV[4*(i+j-1)+2].axis=arrowAxisV
            arrowsV[4*(i+j-1)+3].pos=arrowStartV.multiply(-1)
            arrowsV[4*(i+j-1)+3].axis=arrowAxisV.multiply(-1)

        
        
        }
    }

        



    


}
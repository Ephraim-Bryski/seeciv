function mesh(a,b){ 
// equivalent of meshgrid: creates matrix from vectors
// can also be used for elementwise multiplication of row and column vectors

// a is row vector
// b is column vector

var A=a
var B=b
for (let j=0;j<math.size(b)[0]-1;j++) {A=math.concat(A,a,0)}
for (let i=0;i<math.size(a)[1]-1;i++) {B=math.concat(B,b,1)}

return [A,B]  // JS can't return multiple variables, so just use indices to get A and B

}

function makeSurf(A,B,C,colorSel=color.gray,opacitySel=1){ 
// A, B, and C are equal size matrices and x, y, z coordinates of points
//! making points isn't needed

// creates surface
var myPoints=math.zeros(math.size(A)[0],math.size(A)[1])._data //just to make points the same size
var vertices=math.zeros(math.size(A)[0],math.size(A)[1])._data //just to make points the same size

var surf=math.zeros(math.size(A)[0]-1,math.size(A)[1]-1)._data

for (let i=0;i<math.size(A)[0];i++){
    for (let j=0;j<math.size(A)[1];j++){    
    myPoints[i][j]=vec(A[i][j],B[i][j],C[i][j])  
    vertices[i][j]=vertex({pos: vec(A[i][j],B[i][j],C[i][j]), color:colorSel,opacity:opacitySel})

    if (i!=0&&j!=00){
        surf[i-1][j-1]=quad({vs: [vertices[i-1][j-1],vertices[i][j-1],vertices[i][j],vertices[i-1][j]]})
    } 
    }
}
//points({pos: myPoints.flat()})

return surf
}

function changeSurf(surf,A,B,C){
    // modifies surface created with makeSurf
    // surf is the surface
    // A, B, and C are the new array of points
    for (let i=0;i<math.size(surf)[0];i++){
        for (let j=0;j<math.size(surf)[1];j++){
            var myQuad= surf[i][j]
            for (let ii=0;ii<4;ii++){
            var myVertex=myQuad.vs[ii]
            if (ii==0){index=[i,j]}
            if (ii==1){index=[i+1,j]}
            if (ii==2){index=[i+1,j+1]}
            if (ii==3){index=[i,j+1]}   

            myVertex.pos=vec(A[index[0]][index[1]],B[index[0]][index[1]],C[index[0]][index[1]])

            }
        } 
    }
    return surf
}
  
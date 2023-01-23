// basically just a json file, read in compute_sheet for computing (imported in py_worker), and later in see_calc for actually making the visuals (imported in see_calc.html)

vis_blocks = [
    {
        "name":"Box",
        "vars":["L","H","W","x","y","z"],

        // to be called once numeric values have been subbed in for all (check at end?)
        "vis":(inp)=>{
            box({pos:vec(inp.x,inp.y,inp.z),size:vec(inp.L,inp.H,inp.W)}) 
        }
    },

    {
        "name":"Rod",
        "vars":["r","h","z0","a1","a2"],
        "vis":(inp)=>{
            // for now im assuming it's along the z axis
            
            var r = inp.r
            var h = inp.h
            var z0 = inp.z0
            var theta1 = inp.a1*Math.PI/180
            var theta2 = inp.a2*Math.PI/180
        
            //z0 = z0-0.1
    
            
            var nCoils=8
    
            var thick=.01
    
            var gridColor = color.blue
    
    
    
    
            var rod=cylinder({pos: vec(0,0,z0), axis:vec(0,0,h),opacity: 1,radius:r,opacity:0.9})
    
    
    
            var phi = theta2-theta1
            
            var coils=[]
            var nCoilPoints=10  // number of points on helix
            for (let i=0;i<nCoils;i++){
    
    
                var coilPoints=[]
                for (let j=0;j<nCoilPoints;j++){
                    var angle=phi*j/(nCoilPoints-1)+2*Math.PI*i/nCoils+theta1
                    coilPoints[j]=vec(r*cos(angle),r*sin(angle),z0+h*j/(nCoilPoints-1))
                    //coils[i].modify(j,coilPoints[j])
                    
                }
    
    
    
                coils[i]=curve({pos: coilPoints,thickness: thick, color: gridColor})
            }
        }
          
    }

]
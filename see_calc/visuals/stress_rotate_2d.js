
const draw_stress_rotate_2d = {

    name: "StressRotate2D",
    vars: {
        "x_0": 0,
        "y_0": 0,
        "size":1,
        "\\theta":0,
        "\\sigma_x":0,
        "\\sigma_y":0,
        "\\tau":0,
        "scale": 0.1
        
    },
    vis: (inp)=>{

    
    const x0 = inp.x_0
    const y0 = inp.y_0
    const theta = inp["\\theta"]*Math.PI/180
    const size = inp.size
    const sx = inp["\\sigma_x"]
    const sy = inp["\\sigma_y"]
    const tau = inp["\\tau"]
    const arrow_scale = inp["scale"]

    const objects = []
    
    const center = vec(x0,y0,0)
    
    const tiny_thickness = 10**-3
    objects.push(box({pos: center, length: size, width:tiny_thickness, height:size}))
    
    
    const normal_stresses = {"x":sx, "y":sy}
    for (let axis of ["x","y"]){
    
        const stress = normal_stresses[axis]
    
        for (let sign of [-1,1]){
    
            let arrow_pos = vec(0,0,0)
            arrow_pos[axis] = sign*size/2
            arrow_pos = arrow_pos.add(center)
    
            const arrow_axis = vec(0,0,0)
            arrow_axis[axis] = sign*stress*arrow_scale
    
            if (stress<0){
                arrow_pos = arrow_pos.add(arrow_axis.multiply(-1))
            }
        
            objects.push(arrow({pos: arrow_pos, axis: arrow_axis, color: color.blue}))
        
        }
        
    }
    
    
    
    for (let axis_pos of ["x","y"]){
    
    
        for (let sign of [-1,1]){
    
            let axis_dir 
            if (axis_pos === "x"){axis_dir = "y"}
            if (axis_pos === "y"){axis_dir = "x"}
    
            let arrow_pos = vec(0,0,0)
            arrow_pos[axis_pos] = sign*size/2
            arrow_pos = arrow_pos.add(center)
    
            const arrow_axis = vec(0,0,0)
            arrow_axis[axis_dir] = sign*tau*arrow_scale
            
            arrow_pos = arrow_pos.add(arrow_axis.multiply(-1/2))
            
        
            objects.push(arrow({pos: arrow_pos, axis: arrow_axis, color: color.red}))
        
        }
        
    }
    
    
    
    
    
    for (let object of objects){
        object.rotate({axis: vec(0,0,1),angle:theta,origin:center})
    }
    

    
}        

}


vis_blocks.push(draw_stress_rotate_2d)
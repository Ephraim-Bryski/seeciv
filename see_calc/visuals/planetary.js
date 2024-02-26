
const base_spoke_angles = [0,Math.PI/2,Math.PI,3*Math.PI/2]

const spoke_color = color.black 

const draw_planetary = {
    
    name: "PlanetaryGear",
    vars: {
        x: 0,
        y: 0,
        z: 0,
        R_s: 1,
        R_p: 1,
        t: 0,
        "\\omega_s": 0,
        "\\omega_p": 0,
        "\\omega_c": 0,
        "\\omega_r": 0,
        "color_s": '"r"', // for now will auto check for color in variable name
        "color_p": '"g"',
        "color_r": '"w"'
    },
    vis: (inp)=>{


    x = inp.x
    y = inp.y
    z = inp.z
    R_s = inp.R_s
    R_p = inp.R_p
    angle_s = inp["\\omega_s"]*inp.t
    angle_p = inp["\\omega_p"]*inp.t
    angle_c = inp["\\omega_c"]*inp.t
    angle_r = inp["\\omega_r"]*inp.t

    color_s = color_map[inp.color_s]
    color_p = color_map[inp.color_p]
    color_r = color_map[inp.color_r]

    const R_ring = R_s+R_p*2
    const R_case = R_s+R_p
    make_gear(x,y,z,R_s,angle_s,color_s, planetary_length)
    make_ring_gear(x,y,z,R_ring,angle_r,color_r, planetary_length)

    const n_planets = 3

    for(let i=0;i<n_planets;i++){
        const base_orbit_angle = i/n_planets*2*Math.PI
        const orbit_angle = base_orbit_angle+angle_c*Math.PI/180
        const planet_x = x+R_case*Math.cos(orbit_angle)
        const planet_y = y+R_case*Math.sin(orbit_angle)
        make_gear(planet_x,planet_y,z,R_p,angle_p,color_p, planetary_length)
    }

    function make_ring_gear(x,y,z,inner_R,theta,gear_color, length){
        
        if (inner_R === 0){
            return
        }
        
        const center = vec(x,y,z)
    
        const thickness = 0.1*inner_R   // arbitrary
        const outer_R = inner_R + thickness
    
        const thickness_ratio = (outer_R-inner_R)/outer_R
        const ring_shape = shapes.circle({radius:outer_R,thickness: thickness_ratio,np:30})
        
        const gear_axis = vec(0,0,length)
        
        const line_path = [center,center.add(gear_axis)]
        extrusion({shape: ring_shape, path: line_path,color:gear_color})
    
        for (base_angle of base_spoke_angles){
            const angle = base_angle+theta*Math.PI/180
            const x1 = x+inner_R*Math.cos(angle)
            const y1 = y+inner_R*Math.sin(angle)
            const x2 = x+outer_R*Math.cos(angle)
            const y2 = y+outer_R*Math.sin(angle)    
            const z_F = z
            const z_B = z+gear_depth
            curve({pos:[vec(x1,y1,z_F),vec(x2,y2,z_F)],color:spoke_color})
            curve({pos:[vec(x1,y1,z_B),vec(x2,y2,z_B)],color:spoke_color})
            curve({pos:[vec(x1,y1,z_F),vec(x1,y1,z_B)],color:spoke_color})
            curve({pos:[vec(x2,y2,z_F),vec(x2,y2,z_B)],color:spoke_color})
        }
    }
    
        
}}


const draw_wheel = {


    name: "Wheel",
    vars: {
        x_0:0,
        y_0:0,
        z_0:0,
        L:1,
        r:1,
        "\\theta":0
    },

    vis: (inp)=>{

        make_gear(inp.x_0, inp.y_0, inp.z_0, inp.r, inp["\\theta"], color.white, inp.L)

    }
}

    


function make_gear(x,y,z,R,theta,gear_color, length){

    const gear_depth = 1
    const gear_axis = vec(0,0,length)
    
    cylinder({pos:vec(x,y,z), axis: gear_axis,radius:R,color:gear_color})

    
    const angles = base_spoke_angles.map(angle => {return angle+theta*Math.PI/180})
    
    // gonna assume along z axis
    const spoke_points_F = angles.map(angle => {
        const x_pos = x+R*Math.cos(angle)
        const y_pos = y+R*Math.sin(angle)
        return vec(x_pos,y_pos,z)
    })


    const spoke_points_B = spoke_points_F.map(point => {
        return point.add(gear_axis)
    })

    curve({pos:[spoke_points_F[0],spoke_points_F[2]],color:spoke_color})
    curve({pos:[spoke_points_F[1],spoke_points_F[3]],color:spoke_color})

    
    curve({pos:[spoke_points_B[0],spoke_points_B[2]],color:spoke_color})
    curve({pos:[spoke_points_B[1],spoke_points_B[3]],color:spoke_color})

    spoke_points_F.forEach((point_F,idx)=>{
        const point_B = spoke_points_B[idx]
        curve({pos:[point_F,point_B], color:spoke_color})
    })
}

vis_blocks.push(draw_planetary)
vis_blocks.push(draw_wheel)

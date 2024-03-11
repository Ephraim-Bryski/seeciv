const draw_box = {

    name: "Box",

    vars: {
        "x":0,
        "y":0,
        "z":0,
        "L":1,
        "H":1,
        "W":1,
    },

    vis: (inp)=>{
        box({pos:vec(inp.x,inp.y,inp.z),
            size:vec(inp.L,inp.H,inp.W)}) 
    }
}

const draw_cylinder = {
    name: "Cylinder",

    vars: {
        "x_1":0,
        "y_1":0,
        "z_1":0,
        "x_2":1,
        "y_2":0,
        "z_2":0,
        "r":1},
    
    vis: (inp)=>{

        const axis = vec(
            inp.x_2-inp.x_1,
            inp.y_2-inp.y_1,
            inp.z_2-inp.z_1)

        cylinder({pos:vec(inp.x_1,inp.y_1,inp.z_1),
                axis:axis,
                radius:inp.r})
    }
}

const draw_arrow = {
    name: "Arrow",
    vars: {
        x_0: 0,
        y_0: 0,
        z_0: 0,
        v_x: 1,
        v_y: 0,
        v_z: 0,
        scale: 1,
        color: '"w"'
    },
    vis: (inp)=>{
        const pos = vec(inp.x_0,inp.y_0,inp.z_0)
        const axis = vec(inp.v_x*inp.scale, inp.v_y*inp.scale, inp.v_z*inp.scale)
        arrow({pos: pos, axis: axis, round: true, color: color_map[inp.color]})
    }
}

const draw_line = {
    name: "Line",
    vars: {
        x_1: 0,
        x_2: 1,
        y_1: 0,
        y_2: 0,
        z_1: 0,
        z_2: 0
    },
    vis: (inp) => {
        const p1 = vec(inp.x_1,inp.y_1,inp.z_1)
        const p2 = vec(inp.x_2,inp.y_2,inp.z_2)

        curve({pos: [p1,p2]})
    }
}

const draw_circle = {
    name: "Circle",
    vars: {
        R: 1,
        "x_c": 0,
        "y_c": 0
    },
    vis: (inp)=>{
        
        const R = inp.R
        const xc = inp["x_c"]
        const yc = inp["y_c"]

        const n_points = 100
        
        let point_previous
        let point_start
        let point
        
        for (let i=0;i<n_points;i++){
            theta = 2*Math.PI*i/n_points
            x = xc+R*Math.cos(theta)
            y = yc+R*Math.sin(theta)
        
            point = vec(x,y,0)
            if (point_previous){
                curve({pos: [point_previous, point]})
            }else{
                point_start = point
            }
        
            point_previous = point
        }
        
        
        curve({pos: [point, point_start]})

    }
}

const draw_plane_xy = {
    name: "PlaneXY",
    vars: {
        "x_{min}": -1,
        "x_{max}": 1,
        "y_{min}": -1,
        "y_{max}": 1,
        "z": 0
    },

    vis: inp => {
        draw_plane(inp,"x","y")
    }
}


const draw_plane_xz = {
    name: "PlaneXZ",
    vars: {
        "x_{min}": -1,
        "x_{max}": 1,
        "z_{min}": -1,
        "z_{max}": 1,
        "y": 0
    },

    vis: inp => {
        draw_plane(inp,"x","z")
    }
}



const draw_plane_yz = {
    name: "PlaneYZ",
    vars: {
        "y_{min}": -1,
        "y_{max}": 1,
        "z_{min}": -1,
        "z_{max}": 1,
        "x": 0
    },

    vis: inp => {
        draw_plane(inp,"y","z")
    }
}



function draw_plane(input,dim1,dim2){


        const min1 = input[`${dim1}_{min}`]
        const max1 = input[`${dim1}_{max}`]
        const min2 = input[`${dim2}_{min}`]
        const max2 = input[`${dim2}_{max}`]
    
        const pos1 = (max1+min1)/2
        const pos2 = (max2+min2)/2

        const pos = vec(0,0,0)

        const box_key_map = {
            x: "length",
            y: "height",
            z: "width"
        }
        
        const key1 = box_key_map[dim1]
        const key2 = box_key_map[dim2]
        

        const other_dim = [...Object.keys(box_key_map)].filter(key => {
            return dim1 !== key && dim2 !== key
        })[0]

        pos[dim1] = pos1
        pos[dim2] = pos2
        pos[other_dim] = input[other_dim]

        const box_arguments = {pos: pos, opacity: 0.5}

        box_arguments[key1] = max1-min1
        box_arguments[key2] = max2-min2
        box_arguments[box_key_map[other_dim]] = 0.01

        box(box_arguments)
}


const draw_sphere = {
    name: "Sphere",

    vars: {
        "x_0":0,
        "y_0":0,
        "z_0":0,
        "r":1},
    
    vis: (inp)=>{
        sphere({pos:vec(inp.x_0,inp.y_0,inp.z_0),
                radius:inp.r})
    }
}

const draw_ramp = {

    // gonna be assumed it's running along the z axis and is at y=0

    name: "Ramp",

    vars: {
        x_0:0,
        z_0:0,
        L:2,
        H:1,
        t:1
    },

    vis: (inp)=>{
        
        const triangle = [
            [0, 0],
            [inp.L, 0],
            [inp.L, inp.H],
            [0, 0]
        ]  

        const path = [
            vec(inp.x_0, 0, inp.t),
            vec(inp.x_0, 0, -inp.t)
        ]

        extrusion({
            path: path,
            shape: triangle
        })

    }
}

vis_blocks.push(draw_box)
vis_blocks.push(draw_cylinder)
vis_blocks.push(draw_arrow)
vis_blocks.push(draw_ramp)
vis_blocks.push(draw_line)
vis_blocks.push(draw_circle)
vis_blocks.push(draw_plane_xy)
vis_blocks.push(draw_plane_xz)
vis_blocks.push(draw_plane_yz)
vis_blocks.push(draw_sphere)

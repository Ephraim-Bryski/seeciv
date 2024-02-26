
const draw_water_wave = {
    name: "WaterWave",
    vars: {
        d: 5,
        H: 1,
        "\\phi": 0,
        "\\lambda": 2,
        "x_{min}": 0,
        "x_{max}": 10,


    },

vis: inp => {
    
    const depth = inp.d
    const height = inp.H
    const phi = inp["\\phi"]
    const length = inp["\\lambda"]
    const x_min = inp["x_{min}"]
    const x_max = inp["x_{max}"]

    const channel_width = 1
    
    const water_color = vec(0,0,0.7)

    const n_steps = 100

    function get_elevation(x){
        return depth+height/2*Math.sin(2*Math.PI*x/length-phi*Math.PI/180)
    }
    
    function linspace(start, end, steps) {
        const stepSize = (end - start) / (steps - 1);
        return Array.from({ length: steps }, (_, index) => start + index * stepSize);
    }

    
    const x_positions = linspace(x_min, x_max, n_steps);


    const top_points = x_positions.map(x => {
        const y = get_elevation(x)
        return [x,y]
    })
    const bottom_points = [[x_max,0],[x_min,0]]
    const shape = top_points.concat(bottom_points)
    shape.push(top_points[0]) // so it's a closed loop  

    const z_f = 0
    const z_b = channel_width

    const path = [vec(0,0,z_b),vec(0,0,z_f)]


    extrusion({shape: shape, path: path, color: water_color})

    return

    const elevations = x_positions.map(get_elevation)
    
    for (let i=0;i<elevations.length-1;i++){
        const y_1 = elevations[i]
        const y_2 = elevations[i+1]
        const x_1 = x_positions[i]
        const x_2 = x_positions[i+1]


        const points = [
            [x_1,0,z_f], // 0
            [x_2,0,z_f], // 1
            [x_1,y_1,z_f],// 2
            [x_2,y_2,z_f],// 3
            [x_1,0,z_b], // 4
            [x_2,0,z_b], // 5
            [x_1,y_1,z_b], //6
            [x_2,y_2,z_b], //7
        ]

        const quad_point_idxs = [
            [0,1,3,2],
            [4,5,7,6],
            [2,3,7,6],
            [0,1,5,4]
        ]
        
        const vertices = points.map(p => {
            return vertex({pos:vec(...p),color:water_color}) 
        })


        quad_point_idxs.forEach(idxs => {
            quad_vertices = idxs.map(idx => {
                return vertices[idx]
            })

            quad({vs:quad_vertices})
        })
        
        
    }


    

    
}        


}
    
vis_blocks.push(draw_water_wave)
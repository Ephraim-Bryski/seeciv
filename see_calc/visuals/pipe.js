const draw_pipe = {
    name: "Pipe",
    vars: {
        y_1: 0,
        y_2: 1,
        x_1: 0,
        x_2: 10,
        D: 1,
        z: 0
    },
    vis: (inp) => {
        // maybe doesn't reall matter, but i really want it to be a 

        const water_color = vec(0.3,0.3,0.8)
        const R = inp.D/2

        const shift1 = vec(inp.x_1,inp.y_1,inp.z)
        const shift2 = vec(inp.x_2,inp.y_2,inp.z)

        const n_points = 100
        const angles = [...Array(n_points).keys()].map(i => {
            return 2*Math.PI*i/n_points
        })

        const circle_points = angles.map(angle => {
            return vec(0,R*Math.cos(angle),R*Math.sin(angle))
        })

        const vertices1 = circle_points.map(base_point => {
            return vertex({pos: base_point.add(shift1),emissive:false,shininess:0,color:water_color})
        })

        const vertices2 = circle_points.map(base_point => {
            return vertex({pos: base_point.add(shift2),emissive: false,shininess:0,color:water_color})
        })

        const center1 = vertex({pos: shift1,color:water_color})
        const center2 = vertex({pos: shift2,color:water_color})

        vertices1.forEach((v1,idx)=> {
            const v2 = vertices2[idx]

            let next_idx 
            if (idx+1 === n_points){
                next_idx = 0
            }else{
                next_idx = idx+1
            }

            const v1_next = vertices1[next_idx]
            const v2_next = vertices2[next_idx]

            quad({vs: [v1, v2, v2_next, v1_next]})

            triangle({vs: [v1, v1_next, center1]})
            triangle({vs: [v2, v2_next, center2]})
        })

    }
}


vis_blocks.push(draw_pipe)
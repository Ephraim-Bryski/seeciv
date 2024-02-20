


// might have it rotated but for now just along (1,0,0)
// would just use rotate method on all the objects


const draw_stretchy_rod = {
    name: "StretchyRod",
    vars: {
        R: 1,
        x_1: 0,
        x_2: 5,
        "\\epsilon": 0
    },
    vis: (inp) => {

        const R = inp.R
        const x1 = inp.x_1
        const x2 = inp.x_2
        const strain = inp["\\epsilon"]

        if (strain === -1){
            strain += 10**-4
        }
    
        const L = x2-x1
    
        const position = vec(x1,0,0)
        const center = vec((x1+x2)/2,0,0)
        const axis = vec(L,0,0)
        cylinder({radius: R, pos: position, axis: axis})
    
        const n_coils = L/(2*Math.PI*R*(strain+1))
    
        const n_helices = 5
    
    
        // im not able to change to ccw for the builtin helix, so im just gonna do it myself :)
    
    
        function draw_helix(start_angle, direction_sign){
    
            const n_points = Math.ceil(20*n_coils)
    
    
            const total_angle = n_coils*2*Math.PI
    
            const points = []
    
            for (let i=0;i<=n_points;i++){
                const fraction = i/n_points
                const angle = start_angle+direction_sign*fraction*total_angle
                const x = x1 + fraction*L
                const y = R*Math.cos(angle)
                const z = R*Math.sin(angle)
                points.push(vec(x,y,z))
            }
    
            curve({pos:points,color:color.blue})
    
        }
    
        for (let i=0;i<n_helices;i++){
            const rotate_angle = 2*Math.PI*i/n_helices
            
            draw_helix(rotate_angle,1)
            draw_helix(rotate_angle,-1)
        }
    
        
        /*
        pos
        axis
        radius
        
        coils
        ccw
        */
    
    }
}


vis_blocks.push(draw_stretchy_rod)


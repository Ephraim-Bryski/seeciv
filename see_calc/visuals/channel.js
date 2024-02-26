
const draw_channel = {
    
    name: "Channel",
    vars: {
        L:5,
        y:1,
        W:1,
        W_2:2,
        S:0,
    },
    vis: (inp)=>{



    const depth = inp.y
    const length = inp.L
    const width = inp.W
    const width2 = inp.W_2
    // const tilt = inp["\\alpha"]
    const slope = -inp["S"]

    
    function make_quad(points,quad_color){
    
        const vertices = points.map(point => {
            return vertex({pos:point, color:quad_color})
        })
        quad({vs:vertices})

    }




    const wall_color = vec(0.6,0.3,0.5)
    const water_color = vec(0,0,0.7)

    // const tilt_shift = depth*Math.sin(tilt*Math.PI/180)
    const slope_shift = length*slope

    const front_BL = vec(-width/2,0,0)
    const front_BR = vec(width/2,0,0)
    const front_TL = vec(-width2/2,depth,0)
    const front_TR = vec(width2/2,depth,0)

    const length_vec = vec(0,-slope_shift,length)

    const back_BL = front_BL.add(length_vec)
    const back_BR = front_BR.add(length_vec)
    const back_TL = front_TL.add(length_vec)
    const back_TR = front_TR.add(length_vec)


    make_quad([front_BL,back_BL,back_BR,front_BR],wall_color) // floor

    
    make_quad([front_BL,back_BL,back_TL,front_TL],wall_color) // left wall
    make_quad([front_BR,back_BR,back_TR,front_TR],wall_color) // right wall

    make_quad([front_BL,front_BR,front_TR,front_TL],water_color)  // front 
    make_quad([back_BL,back_BR,back_TR,back_TL],water_color)      // back
    make_quad([back_TL,back_TR,front_TR,front_TL],water_color)    // top




    






}}

vis_blocks.push(draw_channel)
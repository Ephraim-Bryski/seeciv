window.__context= {glowscript_container: $("#vis")[0]}  
// make_mohr()

draw_circle(10,0,0,0)

function draw_circle(radius,thickness,x_c,y_c){
    // assumes circle is on the xy plane



    const circle = shapes.circle({radius:thickness/2})

    const n_points = 4
    const circle_path = []
    for (let i=0;i<n_points;i++){
        const theta = 2*Math.PI*i/n_points
        const x = x_c+radius*Math.cos(theta)
        const y = y_c+radius*Math.sin(theta)
        circle_path.push(vec(x,y,0))
    }

    const boop = paths.circle()
    // boop.map(vector => {return vector.add(vec(1,0,0))})
    extrusion({shape: circle, path: boop})

}

function make_mohr(){

    const scene = canvas()
    const scene_range = scene.range

    const tick_sphere_radius = 0.02*scene_range
    const shaft_width = 0.02*scene_range
    const head_length = 3*shaft_width // based on glowscript's doc

    const increment = find_increment(scene_range)

    const n_increments = Math.floor(scene_range/increment)
    

    coord_names = {x: "σ",y:"τ"}


    for (dim of ["x","y"]){
        make_axis(dim)
    }
    
    
    function find_increment(scene_range){
    
        // TODO make it in increments of 1, 2, or 5

        // screw it just do powers of 10 instead
        const min_steps = 2
    
        const power = Math.floor(Math.log10(scene_range))
    
        const boop = 10**power
    
        if (scene_range/boop >= min_steps){
            return boop
        }else{
            return boop/10
        }
    
    }
    
    function make_axis(dim){
    
        // TODO use range

        const tick_shift_dims = {x: 'y', y: 'z', z: 'x'}

        for (let i=1; i<n_increments; i++){
            const tick_pos = i*increment

            for (sign of [1,-1]){

                const tick_vec = vec(0,0,0)
                tick_vec[dim] = sign*tick_pos
                sphere({pos: tick_vec, radius: tick_sphere_radius})

                const label_vec = vec(0,0,0)
                label_vec[dim] = sign*tick_pos
                
                label_vec[tick_shift_dims[dim]] = -0.06*scene_range

                label({'text': sign*tick_pos, 'pos': label_vec, height: 10, box: false, opacity:0})
            }
            
        }
 
        const arrow_extra_factor = 0.2
        const label_extra_factor = 0.1
        const arrow_length = scene_range*(2+arrow_extra_factor)

        direction = vec(0, 0, 0)
        
        direction[dim] = arrow_length
    
        position = vec(0, 0, 0)
    
        position[dim] = -arrow_length/2+head_length
    
    
        const coord_arrow = arrow({pos: position, axis: direction, round: true, shaftwidth: shaft_width})
        // coord_arrow.visible = false
    
        const text_position = vec(0, 0, 0)
    
        text_position[dim] = arrow_length/2*(1+label_extra_factor)
    
        
        label({text: coord_names[dim], pos: text_position, box: false, opacity:0})
        // boop.visible = false
    
    
    }
    
}

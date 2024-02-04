


const graphDiv = $("#vis")[0]
window.__context= {glowscript_container: graphDiv}  
scene = canvas()



var sleep = duration => new Promise(resolve => setTimeout(resolve, duration))

var poll = (promiseFn, duration) => promiseFn().then(
             sleep(duration).then(() => poll(promiseFn, duration)))

poll(() => new Promise(check_zoom), .1)

var old_range
var scale_length
const coordinate_lines = []
const coordinate_labels = []





function check_zoom(){

    if (old_range === scene.range){    
        return
    }
    const zoom_scale = scene.range/old_range

    old_range = scene.range

    if (isNaN(zoom_scale)){
        return
    }
    

    for (line of coordinate_lines){
        const old_pos = line.point(1).pos
        const new_pos = old_pos.multiply(zoom_scale)
        line.modify(1,pos=new_pos)
        
    }

    for (label of coordinate_labels){
        label.pos = label.pos.multiply(zoom_scale)
    }

    scale_length *= zoom_scale
    write_scale_text()
    // const size = my_sphere.size
    // const new_size = [size.x, size.y, size.y].map(val => {return val*zoom_scale})

    // my_sphere.size = vec(...new_size)

}

function set_ortho(){
    scene.axis = vec(-1,-1,-1)
}
function set_xy(){
    scene.axis = vec(0,0,-1)
}

function write_scale_text(){

    const scale_text = `1:${to_scientific_notation(scale_length)}`


    $("#scale-text")[0].innerText = scale_text

    function to_scientific_notation(value){
        const exponent = Math.floor(Math.log10(value))
    
        if (exponent == 0){
            return String(round(value))
        }
    
    
        const base = round(value/(10**exponent))
    
        return `${base}E${exponent}`
    }
    
    
    
}



function mini_coordinate_system(){

    const scene_range = scene.range
    const length = scene_range/10
    const p0 = vec(0,0,0)

    const axes = ["x","y","z"]


    for (let i=0;i<3;i++){
        
        const axis = axes[i]

        p = vec(0,0,0)
        p[axis] = length

        const coordinate_label = label({'text': axis, 'pos': p.multiply(1.2), height: 10, box: false, border:2})

        coordinate_labels.push(coordinate_label)


        const line = curve({pos:[p0,p],emissive:true})

        coordinate_lines.push(line)


    }

    function to_scientific_notation(value){
        const exponent = Math.floor(Math.log10(value))
    
        if (exponent == 0){
            return String(round(value))
        }
    
    
        const base = round(value/(10**exponent))
    
        return `${base}E${exponent}`
    }
    
    
    
    
    scale_length = length
    write_scale_text()
    // const px = p0.add(vec(length,0,0))
    // const py = p0.add(vec(0,length,0))
    // const pz = p0.add(vec(0,0,length))
    
    // coordinate_lines.push(curve({pos:[p0,px],emissive:true}))
    // coordinate_lines.push(curve({pos:[p0,py],emissive:true}))
    // coordinate_lines.push(curve({pos:[p0,pz],emissive:true}))

    
    // label({'text': 'x', 'pos': px.multiply(1.2), height: 10, box: false, opacity:0})
    // label({'text': 'y', 'pos': py, height: 10, box: false, opacity:0})
    // label({'text': 'z', 'pos': pz, height: 10, box: false, opacity:0})

    scene.range = scene_range
    
    

}




mini_coordinate_system()

function draw_coordinate_system(){

    const scene_range = scene.range

    const tick_sphere_radius = 0.02*scene_range
    const shaft_width = 0.02*scene_range
    const head_length = 3*shaft_width // based on glowscript's doc

    const increment = find_increment(scene_range)

    const n_increments = Math.floor(scene_range/increment)
    
    for (dim of ["x","y","z"]){
        make_axis(dim)
    }

    scene.range = scene_range
    
    
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
    
        const new_position = position.add(direction)


        const big_number = 100
        const p1 = vec(0,0,0)
        p1[dim] = -big_number
        
        const p2 = vec(0,0,0)
        p2[dim] = big_number
        


        curve({pos: [p1,p2]})


        // const coord_arrow = arrow({pos: position, axis: direction, round: true, shaftwidth: shaft_width})
        // coord_arrow.visible = false
    
        const text_position = vec(0, 0, 0)
    
        text_position[dim] = arrow_length/2*(1+label_extra_factor)
    
        
        label({text: dim, pos: text_position, box: false, opacity:0})
        // boop.visible = false
    
    
    }
    
}

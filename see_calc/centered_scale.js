// probably not gonna go with this one, but in case i wanna center it at the origin instead
    // pros for stuff like pendulum, it makes orbiting much more intuitive
    // cons you then have to think about whether you're centering things

function adjust_scale(){
 
    // this is basically what gs does but i can't figure out how to toggle it on and off
        // by default, gs stops autoadjusting the scale once the range is set (either in code or by zooming)

    const dim_keys = ["x","y","z"]

    const bounds = {}

    let bounds_set = false

    const coordinates = []

    for (object of scene.objects) {

        if (!object.visible){
            continue
        }


        for (dim of dim_keys){

            let range

            if (object instanceof label){
                break
            }if (object instanceof quad){

                const vertex_keys = ["v0","v1","v2","v3"]

                vertex_keys.forEach((vertex) => {  
                    const coordinate = object[vertex]["pos"][dim]
                    coordinates.push(coordinate)
                })

            }else{
                const min_pos = object.pos[dim] - object.size[dim]/2
                const max_pos = object.pos[dim] + object.size[dim]/2
                coordinates.push(min_pos)
                coordinates.push(max_pos)
            }

            
            


            // const new_bounds = range.map((val,idx) => {

            //     if (bounds[dim] === undefined){
            //         return val
            //     }

            //     let compare_func
            //     if (idx == 0){compare_func = min}
            //     else {compare_func = max}
            //     return compare_func(val, bounds[dim][idx])
            // })

            bounds_set = true
            // bounds[dim] = new_bounds
        }
    }

    if (!bounds_set){
        return
    }

    // const center = Object.values(bounds).map(bound => {
    //     return (bound[1]+bound[0])/2
    // })

    // const ranges = Object.values(bounds).map(bound => {
    //     return bound[1]-bound[0]
    // })
    
    // const range = max(ranges)

    // alternatively set the center to vec(0,0,0) and for the range consider the max of the absolute distance from the origin
    scene.center = vec(0,0,0)

    const absolute_range = max(coordinates.map(Math.abs))
    scene.range = absolute_range
    
}

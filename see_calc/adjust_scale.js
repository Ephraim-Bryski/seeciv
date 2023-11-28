

function resetGS(){
    var reached_coord_labels = false
    scene.objects.forEach(obj=>{
        // this code would prevent it from removing the axes:
        /*
        if (obj.constructor.name==="label"){
            reached_coord_labels = true
            return
        }
        if (!reached_coord_labels){return}
        */
        obj.visible=false
    })
  
}


var graphDiv = document.getElementById("vis")
window.__context= {glowscript_container: graphDiv}  
let scene=canvas({width: graphDiv.offsetWidth,height: graphDiv.offsetHeight,resizable: true,userzoom: true,autoscale: true})
//scene.forward=vec(1,-0.5,-1)

resetGS()

box({size:vec(10,2,1), pos: vec(50,2,3)})

cylinder()
sphere({radius:3, pos:vec(-20,1,2)})



adjust_scale()


function adjust_scale(){

    const dim_keys = ["x","y","z"]

    const bounds = {}

    for (object of scene.objects) {

        if (!object.visible){
            continue
        }

        for (dim of dim_keys){

            const min_pos = object.pos[dim] - object.size[dim]/2
            const max_pos = object.pos[dim] + object.size[dim]/2
            const range =  [min_pos,max_pos]    
            const new_bounds = range.map((val,idx) => {

                if (bounds[dim] === undefined){
                    return val
                }

                let compare_func
                if (idx == 0){compare_func = min}
                else {compare_func = max}
                return compare_func(val, bounds[dim][idx])
            })

            bounds[dim] = new_bounds
        }
    }

    const center = Object.values(bounds).map(bound => {
        return (bound[1]+bound[0])/2
    })

    const ranges = Object.values(bounds).map(bound => {
        return bound[1]-bound[0]
    })
    
    const range = max(ranges)

    scene.center = vec(...center)
    scene.range = range
    
}



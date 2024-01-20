

var sleep = duration => new Promise(resolve => setTimeout(resolve, duration))


var poll = (promiseFn, duration) => promiseFn().then(
             sleep(duration).then(() => poll(promiseFn, duration)))

// Greet the World every second
console.log("boop")

var old_range

/*

zoom in --> new range is less than previous range --> scale < 1

zoom in --> scale sphere down


*/

function check_zoom(){
    if (old_range === scene.range){    
        return
        
    }


    const zoom_scale = scene.range/old_range

    old_range = scene.range

    if (isNaN(zoom_scale)){
        return
    }

    console.log(zoom_scale)
    

    const size = my_sphere.size
    const new_size = [size.x, size.y, size.y].map(val => {return val*zoom_scale})

    my_sphere.size = vec(...new_size)

    
}


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
var scene=canvas({width: graphDiv.offsetWidth,height: graphDiv.offsetHeight,resizable: true,userzoom: true,autoscale: true})
//scene.forward=vec(1,-0.5,-1)

poll(() => new Promise(check_zoom), .1)





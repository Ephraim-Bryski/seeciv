function do_stuff(info){
    resetGS()
    box(info)
}


function resetGS(){
    var reached_coord_labels = false
    scene.objects.forEachE(obj=>{
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

do_stuff({size:vec(1,2,1)})
do_stuff({size:vec(2,1,1)})
do_stuff({size:vec(1,2,1)})
do_stuff({size:vec(2,1,1)})
do_stuff({size:vec(1,2,1)})
do_stuff({size:vec(2,1,1)})
do_stuff({size:vec(1,2,1)})
do_stuff({size:vec(2,1,1)})
do_stuff({size:vec(1,2,1)})



importScripts('https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js');
importScripts("solver.js")
importScripts("compute_sheet.js")
importScripts("https://cdnjs.cloudflare.com/ajax/libs/mathjs/10.6.4/math.js")// integrity="sha512-BbVEDjbqdN3Eow8+empLMrJlxXRj5nEitiCAK5A1pUr66+jLVejo3PmjIaucRnjlB0P9R3rBUs3g5jXc8ti+fQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>

// need to import stuff to get_change_start

let pyodide;

var old_SoEs = []
var SoEs_old_computed = []

self.onmessage=(m)=>{
    var msg = m.data

    if (msg === "load"){
        get_py().then(()=>{
            sympy_solve("a+3=4","a")
            postMessage('loaded')
        })
    }else if (typeof msg === 'object'){
        update_sheet(msg)
    }
}


async function get_py() {
    pyodide = await loadPyodide();
    await pyodide.loadPackage("sympy");
    
}



function update_sheet(SoEs){
    // finds where the last change was made, calls calc to compute the sheet, then postMessage hands the computed sheet back to see_calc.js

    var SoEs_cleaned = deep_clone(SoEs)

    if (old_SoEs.length === 0){
        var change_idx = 0  // document.body.SoEs is initiated as an empty array
    }else{
        var change_idx = get_change_start(old_SoEs,deep_clone(SoEs_cleaned))
    }
    
    if (change_idx===undefined){
        change_idx = SoEs.length
    }


    displays = SoEs.map(SoE=>{return SoE.style_display})
    var SoEs_new_computed = calc(deep_clone(SoEs_cleaned),deep_clone(SoEs_old_computed),change_idx)

    

    var SoEs_computed = deep_clone(SoEs_old_computed.slice(0,change_idx).concat(SoEs_new_computed.slice(change_idx)))


    displays.forEach((display,idx)=>{SoEs_computed[idx].style_display=display})

    postMessage(SoEs_computed)

    old_SoEs = deep_clone(SoEs_cleaned)
    SoEs_old_computed = deep_clone(SoEs_computed)

    
    //return deep_clone([SoEs_cleaned,SoEs_computed])


}



function get_change_start(A,B){


    var same_length = false
    if (A.length>B.length){
        var larger = A
        var smaller = B
    }else if(B.length>A.length){
        var larger = B
        var smaller = A
    }else{
        same_length = true
    }

    if(!same_length){
        len_diff = larger.length-smaller.length
        for (let i=0;i<len_diff;i++){
            smaller.push([])
        }
    }


    for (let i=0;i<A.length;i++){
        if(!structures_same(A[i],B[i])){
            return i
        }
    }


    function structures_same(A,B){
// non-nested arrays dont work
        // checks if two nested arrays have the same data
        var Akeys = Object.keys(A)
        var Bkeys = Object.keys(B)

        if (Akeys.length>Bkeys.length){var ref_keys = Akeys}
        else{var ref_keys = Bkeys}


        var match = true

        ref_keys.forEach(key=>{
            A_in = A[key]
            B_in = B[key]

            if (typeof A_in === "object" && typeof B_in === "object"){
                if(structures_same(A_in,B_in)){
                }else{
                    match = false
                }
            }else if(A_in===B_in){
            }else{
                match = false
            }
        })
        return match
    }

}

function deep_clone(nested){
    return JSON.parse(JSON.stringify(nested))
}


/*

SHOULD NO LONGER BE NEEDED
now that im not using the worker

functions needed in the worker and out of it
i cant import see_calc  to the worker cause i would need to import mathquill
and i cant import mathquill cause it uses the window


*/


async function get_py() {
    pyodide = await loadPyodide();
    await pyodide.loadPackage("sympy");
}



function strip_text(input){  
    var output
    if (input.includes("\\text{")){
        var slice_idx = (input.lastIndexOf("}"))-input.length
        output = input.replace("\\text{","").slice(0,slice_idx)
    }else{
        output = input
    }
    return output
}



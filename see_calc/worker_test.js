importScripts('https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js');
importScripts("solver.js")
let pyodide;

var a = 3
self.onmessage=(m)=>{
    var msg = m.data
    console.log("MESSAGE "+msg)

    if (msg === "load"){
        get_py().then(()=>{
            sympy_solve("a+3=4","a")
            postMessage('loaded')
        })
    }else if (typeof msg === 'object'){
        console.log(msg)
    }else{
        // the message would have to be data, would perform calc in here, return new data
        console.log(pyodide)
        a = a+1
        console.log(a)
        postMessage(sympy_solve("b+3=4","b"))
    
    }
}


async function get_py() {
    pyodide = await loadPyodide();
    await pyodide.loadPackage("sympy");
    
}





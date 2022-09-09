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
        hello()

    }
}

function hello(){
    a = a+1
    console.log(a)
}


async function get_py() {
    pyodide = await loadPyodide();
    await pyodide.loadPackage("sympy");
    
}





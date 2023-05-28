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





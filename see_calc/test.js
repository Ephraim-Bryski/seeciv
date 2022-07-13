








console.log(get_all_vars(["-3"]))

parse_result("['5.00000000000000', y+x]","x")



function parse_result(result,solve_for){


    // parses the result from pyodide, which contains
    result = result.toString()
    var split_result = result.replaceAll("[","").replace("]","").replaceAll("'","").replaceAll(" ","").split(",")
    var sol = split_result[0]
    var simp = split_result[1]

    //! will have to rewrite get_all_vars not using nerdamer (use regexp?)
    var simp_vars = get_all_vars([simp])
    if (simp_vars.length===0){
        var simp_val = parseFloat(simp)
        if(simp_val===0){
            console.log("delete")
            // delete eqn
        }else{
            throw "contradiction"
        }
    }else if (simp_vars.includes(solve_for)){    // solve_for may also need to be passed as an input
        var sol = make_js_exp(sol)
        console.log(sol)
    }else{
        console.log("continue")
        // keep the simplified equation, continue
    }


    function make_js_exp(exp){
        exp = exp.replaceAll("**","^")
        exp = exp.replaceAll(" ","")
        return solve_for+"="+exp
    }
}



function get_all_vars(eqns){
    var regex = /\W([a-zA-Z]\w?)+/g
    var vars = []
    eqns.forEach((eqn)=>{
        txt = "-"+eqn+"-"
        var matches = [...txt.matchAll(regex)]
        var eqn_vars = []
        matches.forEach(match=>{
            var var_txt = match[0].substring(1)
            eqn_vars.push(var_txt)
        })
        vars.push(eqn_vars)
    })
    return [...new Set(vars.flat())]
}



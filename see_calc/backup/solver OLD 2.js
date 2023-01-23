
/*

second solver

uses sympy

works but very slow, often just freezes entirely

doesnt sequence substitution efficiently

based my current solver off of it but without using sympy 



*/




// this would be used for substitution with blank outputs
// this will NOT throw an error if the substitution leads to a contradiction
function remove_vars(eqns,remove_vars){
    var stuff = back_solve(eqns,remove_vars)
    if(get_all_vars(stuff[2]).length===0){
        console.warn("Left over: "+stuff)
        throw "removed too much"
    }else{
        return stuff[2] // the third element has all the remaining equations
    }

}

/*

function solve_eqns(eqns,solve_for=""){
    var eqns_simp = []
    eqns.forEach(eqn=>{
       // eqns_simp.push(sympy_simplify(eqn))
       eqns_simp.push(eqn)
    })
    var eqns_unique = [...new Set(eqns_simp)];
    var vars = get_all_vars(eqns_unique)

    var n_vars = vars.length
    var n_eqns = eqns_unique.length

    

    if (n_vars>n_eqns){
        throw "more unknowns than equations"
    }else if (n_eqns>n_vars){
        throw "more equations than unknowns"
    }
    

    var sympy_sol = sympy_system_solve(eqns_unique,vars)   // returns a string from sympy containing all values in a Matrix
    return format_sol(sympy_sol,vars,solve_for)          // returns a string like "x=3, y=4, z=2"

}
*/


function my_solve_eqns(eqns,solve_var){

    var eqns_simp = []
    eqns.forEach(eqn=>{
       // eqns_simp.push(sympy_simplify(eqn))
       eqns_simp.push(eqn)
    })
    var eqns_unique = [...new Set(eqns_simp)];
    var vars = get_all_vars(eqns_unique)

    var n_vars = vars.length
    var n_eqns = eqns_unique.length

    /*
    if (n_vars>n_eqns){
        throw "more unknowns than equations"
    }else if (n_eqns>n_vars){
        throw "more equations than unknowns"
    }
    */

    var stuff = back_solve(eqns,get_all_vars(eqns))      
    var sols = stuff[0]

    // in a situtation like a+3=a+3, back solve doesn't produce anything (just has extra) so have to check if there are sol
    if (sols.length!==0){
        var last_sol = sols[sols.length-1] // this is the last solution that will be back subbed into the rest
        var last_vars = get_all_vars([last_sol])
        if(last_vars.length!==0){throw "too much unknown"}
    }

    var extra = stuff[2]    // these are the equations which are left over from substitutions, shouldn't have any variables    


    //! if im not using nerdamer i need some other way to check for contradictions (could just send it over to solve_eqn OR check in backsolve)

    extra.forEach((extra_eqn)=>{
        var simp_exp = sympy_simplify(extra_eqn)
        if (get_all_vars(simp_exp).length!==0){throw "solution has variables??"}


        if (Math.abs(parseFloat(simp_exp))>10**-10 ){
            throw "contradiction with equation: "+extra_eqn
        }
    })

    return forward_solve(stuff[0],stuff[1],solve_var)
}

function back_solve(eqns,sub_vars){

    var solve_time = 0
    var simp_time = 0

    if (sub_vars.length===0){return [[],[],eqns]}   // shouldn't be needed

    var ordered_vars = []
    var unordered_eqns = [...eqns] // this syntax gets the values not a reference
    var ordered_sols = []

    if(is_done()){return to_return()}


    for (let i=0;i<eqns.length;i++){
        //check_if_done() // this is performed in the beginning and end

        // get number of variables to solve in terms of for each 


        var new_vars = unordered_eqns.map(eqn=>get_all_vars(eqn)) 


        if(is_done()){return to_return()}

        // sort equations by number of variables to substitute for
        var new_vars_sorted = []
        var unordered_eqns_sorted = []
        // sort the eqns by the number of variables
        for (let j=0;j<unordered_eqns.length;j++){

            var idx = new_vars_sorted.findIndex(elem=>{return new_vars[j].length<elem.length})

            if (idx===-1){idx=new_vars_sorted.length}
            if (intersection(sub_vars,get_all_vars(new_vars[j])).length!==0){   // only add eqns that have variables to substitute
                new_vars_sorted.splice(idx,0,new_vars[j])
                unordered_eqns_sorted.splice(idx,0,unordered_eqns[j])
        
            }
        }


        if (unordered_eqns_sorted.length===0){
            throw "what"
        }
        
        var eqn = unordered_eqns_sorted[0]
        var eqn_vars = new_vars_sorted[0]
        var eqn_sub_vars = intersection(sub_vars,eqn_vars)

        if (eqn_sub_vars.length === 0){
            throw "wut"
        }

        var var_sel = eqn_sub_vars[0]


        var start_time = Date.now()
        
        // if it's already solved (e.g. a-5) much faster to just get the value than numerically solve
        function is_solved(eqn){
            if (eqn.includes("=")|eqn.includes("*")|eqn.includes("/")){return false}
            var tree = math.parse(eqn)
            if (tree.args!==undefined && tree.args[0].name!==undefined && tree.args[1].value!==undefined && ["+","-"].includes(tree.op)){return true}
            return false
        }
        
        if (is_solved(eqn)){
            var eqn_sol = math.parse(eqn).args[1].value.toString()
            if (math.parse(eqn).op==="-"){eqn_sol = "-"+eqn_sol}
        }else if (get_all_vars(eqn).length===1){// && [...eqn.matchAll(var_sel)].length>1){
            console.log('Performing numeric solve on '+eqn)
            var ascend = [...Array(100).keys()]
            var descend = ascend.map(val=>-val)
            var guesses = ascend.concat(descend)
            for (let i=0;i<guesses.length;i++){
                var init_guess = guesses[i]
                var found = false
                try{
                    var eqn_sol = sympy_n_solve(eqn,var_sel,init_guess)
                    console.log("solved numerically, solution: "+eqn_sol)
                    var found = true
                    break
                }catch{continue}
            }
            if (!found){throw "could not solve numerically"}
        }else{
            var sympy_package = sympy_solve(eqn,var_sel)
            var eqn_sol = sympy_package[0]
            var is_complex = sympy_package[1]
    
            if (is_complex==="True"){
                throw "complex: "+eqn_sol+", due to: "+eqn+" solving for "+var_sel
            }
    
        }
        solve_time += Date.now()-start_time



        ordered_vars.push(var_sel)
        ordered_sols.push(eqn_sol)
        unordered_eqns.splice(unordered_eqns.indexOf(eqn),1)        // don't really need indexOf (should be 0)
        // substitute the solution to all the other equations:
        for (let j=0;j<unordered_eqns.length;j++){
            var eqn = unordered_eqns[j]
            var eqn_subbed = sub_all_vars(eqn,var_sel,eqn_sol)


            // only simplify the equation if substitution changes it
            if (eqn!==eqn_subbed){

                var start_time = Date.now()
                var exp_simp = cancel_terms(sympy_simplify(eqn_subbed))    
                simp_time += Date.now()-start_time
                //! BUG: cancel_terms("0") outputs 1
                var eqn_vars = get_all_vars([exp_simp])
                if (Math.abs(parseFloat(exp_simp))>10**-10 && eqn_vars.length===0){
                    throw "contradiction with equation: "+eqn
                }
                var eqn_subbed = exp_simp+"=0"
            }

            unordered_eqns[j] = eqn_subbed
        }

        unordered_eqns = unordered_eqns.filter(eqn=>get_all_vars(eqn).length!==0)   // discards useless equations


        //! do checks with sympy_package (in make_py_solve file)


        if(is_done()){return to_return()}
    }

    throw "cannot finish solving after going through all eqns (SHOULD NOT HAPPEN)"



    // moving these outside because they're called in the beginning and end of loop (keeps the behavior more consistent)
    function is_done(){
        return intersection(get_all_vars(unordered_eqns),sub_vars).length===0 // excess(sub_vars,ordered_vars).length===0  ||){
    }
    function to_return(){
        console.log("TIME TO SOLVE: "+solve_time)
        console.log("TIME TO SIMPLIFY: "+simp_time)
        return [ordered_sols,ordered_vars,unordered_eqns]
    }
}


function forward_solve(ordered_sols,ordered_vars,solve_for){
    solve_for = solve_for.replaceAll(" ","")
    // this would be called after order_solve, used to get numeric values only

    // reverse arrays since you end with a numeric solution in order solve
    ordered_sols.reverse()
    ordered_vars.reverse()
    // first step back substitute
    for (let i=0;i<ordered_sols.length;i++){
        var eqn = ordered_sols[i]
        var var_sel = ordered_vars[i]
        var sol = eqn 

        for (let j=0;j<ordered_sols.length;j++){
            if (i!==j){
                ordered_sols[j] = sub_all_vars(ordered_sols[j],var_sel,sol)
            }
        }
    }
    
    if (solve_for.length!==0 && !ordered_vars.includes(solve_for)){
        throw solve_for+" is not a variable"
    }

    var sol_eqns = []
    // final step is just to solve for the variable:
    for (let i=0;i<ordered_sols.length;i++){
        var sol = smypy_evaluate(ordered_sols[i])
        var solve_var = ordered_vars[i]


        if(solve_for.length === 0 || solve_for === solve_var ){
            sol_eqns.push(solve_var+"="+sol)

        }
    }
    return sol_eqns
}


function smypy_evaluate(exp){
    var exp = make_py_exp(exp)
    var command = "val=N("+exp+");"
    command += "val"
    var result = sympy_compute(command,get_all_vars(exp))

    return result
}

function sympy_simplify(eqn){
    var exp = make_py_exp(eqn)
    var command="simp=expand("+exp+");"
    //command += "simp = nsimplify(simp,tolerance=1e-5,rational=True);"
    command+="simp"

    var result = sympy_compute(command,get_all_vars([eqn])) 


    var new_result = result.replaceAll("Abs","")
    if (result!==new_result){
        console.warn("Removed absolute value from: "+result)
        result = new_result
    }
    return result
}

function sympy_display(exp){
    //var exp = make_py_exp(exp)

    var command = "display=latex(N("+exp+",3),mul_symbol='dot');"
    command+="display"

    return sympy_compute(command,get_all_vars(exp))
}

function sympy_n_solve(eqn,solve_var,init){
    var exp = make_py_exp(eqn)
    var command = "sol=nsolve("+exp+","+solve_var+","+init+");"
    command+= "val=N(sol,chop=True);"
    command+="val"
    return sympy_compute(command,[solve_var]) 
}



function sympy_solve(eqn,solve_for){
    // get variables add Symbol commands for each

    //! now that i'm specifiying the variables should be real in sympy_compute, I don't need to check if the solution's complex
    var exp = make_py_exp(eqn)
    var command="sol=solve("+exp+","+solve_for+");"
    command+="last_sol=sol[-1];"
    command+="val=N(last_sol,chop=True);"
    command+="is_complex=im(last_sol)!=0;"
    command+="result=[val,is_complex];"
    command+="result"

    var result = sympy_compute(command,get_all_vars(eqn))

    var split_result = result.replaceAll("[","").replace("]","").replaceAll("'","").replaceAll(" ","").split(",")
    split_result[0] = make_js_exp(split_result[0],true)
    split_result[1] = make_js_exp(split_result[1],true)

    var sol = split_result[0]

    if(sol.includes("oo")){
        throw "infinity found in: "+sol
    }


    return split_result
}


function make_py_exp(eqn){
    eqn = eqn.replaceAll("^","**")

    if (eqn.slice(-2)==="=0"){      // im separating this case out so the function to remove zero terms recognizes it's a product (inputting "a-b" won't return zero terms even if b is 0 since subtraction is the outer-most operation)
        return eqn.slice(0,eqn.length-2)
    }else if (eqn.includes("=")){
        eqn = eqn.replaceAll("=","-(")
        eqn = eqn + ")"
        var exp = eqn
        return exp
    }else{
        return eqn
    }
}

function make_js_exp(exp,enclose){
    exp = exp.replaceAll("**","^")
    exp = exp.replaceAll(" ","")
    if (enclose){
        return "("+exp+")"
    }else{
        return exp
    }
}


function sympy_compute(command_op_specific,vars) {   
    var command = "from sympy import *;"

    vars.forEach((variable)=>{
        var line = variable+'=Symbol("'+variable+'",real=True);'
        command+=line
    })
    command+=command_op_specific

    try{
        var result = pyodide.runPython(command);   
    }catch(err){
        console.log(command)
        console.warn(err)
        throw "Currently too difficult for program to solve"
    }
    result = result.toString()
    return result


    // construct commands from the equation and what to solve for:
    
}


function excess(A,B){
    // if it's one variable, nerdamer doesn't use an array, so this puts it in an array:
    if (typeof(A)==="string"){A=[A]}
    if (typeof(B)==="string"){B=[B]}
  
    var extras = []
  
    var extras = A.filter(
      function(i){
        return this.indexOf(i)<0;
  
      },
      B
    )
    return extras
  }

function intersection(A,B){
    return A.filter(value => B.includes(value));
}



function sub_all_vars(exp,sub_in,sub_out){

    // if there's an operation, it must be enclosed in parentheses first:
    if (sub_out.match(/\W/)!==null){
        var sub_out = "("+sub_out+")"
    }
    

    var regex = /\W[a-zA-Z](\w?)+/g
    var txt = "-"+exp+"-"
    var matches = [...txt.matchAll(regex)]

    matches = matches.map(match=>[match[0].substring(1), match["index"]])
    matches = matches.filter(match=>match[0]===sub_in)
    match_idxs = matches.map(match=>match[1])

    txt = txt.substring(1,txt.length-1)
    
    var old_len = sub_in.length
    var new_len = sub_out.length
    var change_len = new_len-old_len


    for (let i=0;i<match_idxs.length;i++){
        var old_idx = match_idxs[i]
        var new_idx = old_idx+i*change_len
        var txt = txt.substring(0,new_idx)+sub_out+txt.substring(new_idx+old_len)
    }

    return txt
}

function get_all_vars(eqns){
    var exclude = ["sqrt","pi","sin","cos","tan","sec","csc","cot","sinh","cosh","tanh"]
    if (typeof eqns ==="string"){eqns = [eqns]}
    var regex = /\W[a-zA-Z](\w?)+/g
    var vars = []
    eqns.forEach((eqn)=>{
        txt = "-"+eqn+"-"
        var matches = [...txt.matchAll(regex)]
        var eqn_vars = []
        matches.forEach(match=>{
            var var_txt = match[0].substring(1)

            if (!exclude.includes(var_txt)){
                eqn_vars.push(var_txt)
            }
        })
        vars.push(eqn_vars)
    })
    return [...new Set(vars.flat())]
}




function cancel_terms(exp){
    // this is used so variables in terms that can be cancelled out aren't solved for
    var exp = make_py_exp(exp).replaceAll("**","^")
    var sum_terms = split_terms(exp,"sum")

    // a bit of a quick hack, cancel_terms("0") returns "1" (not exactly sure why)
    if (sum_terms.length <= 1){
        return exp.replaceAll("^","**")
    }


    var all_terms = sum_terms.map(term=>{
        if (term[0]==="-"){
            term = "-1 * ("+term.slice(1)+")"
        }
        return split_terms(term,"product")
    })

    var sample_terms = all_terms[0]     // looking for match across all sum terms, so I can just use the first one as a sample

    var like_terms = sample_terms.filter(compare_term=>
        all_terms.filter(blah=>
            blah.includes(compare_term)
        ).length === all_terms.length
    )


    // cancel like terms:
    var all_terms_simp = all_terms.map(product_terms=>{


        for (let i=0;i<like_terms.length;i++){
            var like_term = like_terms[i]
            var idx = product_terms.indexOf(like_term)
            product_terms.splice(idx,1)
        }
        var combined_terms = combine_terms(product_terms,"product")
        if (combined_terms===""){
            combined_terms = "1"
        }
        return combined_terms
    })


    var new_exp = combine_terms(all_terms_simp,"sum")
    return new_exp.replaceAll("^","**")

}


function combine_terms(terms,type){
    if (type==="sum"){var op = "+"}
    else if (type==="product"){var op = "*"}
    else{throw "invalid op"}

    var combined = ""

    terms.forEach(term=>{
        combined+=term+op
    })

    combined = combined.slice(0,-1)

    return combined
}

function split_terms(exp,type,include_sign=true){

    //! this was commented out before, dont know why
    if (exp[0]==="-"){
        exp = "0"+exp
    }

    if (type==="sum"){
        var ops = ["+","-","*"]
    }else if(type==="product"){
        var ops = ["*","/","^"]
    }else{
        throw "invalid type"
    }

    var terms = []
    var neg_terms = []
    search_tree(exp,1)



    if (include_sign){
        return terms
    }else{
        return [terms,neg_terms]
    }

    function search_tree(exp,exp_sign){
        try{
            var exp_tree = math.parse(exp)
        }catch{
            throw "could not parse equation"
        }


        if (exp_tree.content!==undefined){   // if it's in parentheses you have to get the content property first
            search_tree(exp_tree.content.toString(),exp_sign)
            return
        }

        var arg_trees = exp_tree.args
        var op = exp_tree.op


        if (op!==ops[0] && op!==ops[1]){
            add_term(exp,exp_sign)
            return
        }

       

        arg_trees.forEach((arg_tree,idx)=>{
            var arg = arg_tree.toString()
            //! this doesn't work for something like a-4 (commented code doesnt work with parentheses)
            if (get_all_vars(arg).length===0){//c=(arg_tree.op===undefined || arg_tree.fn === "unaryMinus"){//
                if (op===ops[1] && idx===1){add_term(arg,-exp_sign)}
                else{add_term(arg,exp_sign)}
            }else{
                if (op===ops[1] && idx===1){search_tree(arg,-exp_sign)}
                else{search_tree(arg,exp_sign)}
            }

        })


        function add_term(term,exp_sign){  
            if (term==="0"){return}   
            if (exp_sign===1){
                terms.push(term)
            }else if (include_sign){
                terms.push("("+term+")"+ops[2]+"(-1)")
            }else{
                neg_terms.push(term)
            }
        }
    }
}


function move_terms(exp){
    //! numbers aren't moved over (a-4 is lumped into a single term)
    exp = exp.replaceAll("**","^")
    var all_terms = split_terms(exp,"sum",false)
    var pos_terms = all_terms[0]
    var neg_terms = all_terms[1]
    
    var LHS = ""
    var RHS = ""
    
    pos_terms.forEach(term=>{LHS+=term+"+"})
    neg_terms.forEach(term=>{RHS+=term+"+"})

    
    LHS = LHS.slice(0,-1)
    RHS = RHS.slice(0,-1)

    if (LHS.length===0 || RHS.length===0){
        return exp+"=0"
    }
    
    return LHS+"="+RHS
}



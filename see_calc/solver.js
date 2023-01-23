



/*


other things


replace e (and maybe other variables, will have to check) with something else (e is taken as *10^ in some library, either math or nerdamer)



*/


/*
what do all the functions do:
    sub_out: takes all the expressions at that step, calls solve exp for each of them, gets the simplest one, combines the factor tree into a dictionary and subs it out to the other expressions
    solve_exp: takes the expressions and tests for variables to solve for, first one that works (doesnt cause an exception in factor), gets passed to sub_out
    factor, given the expression and the variable, tries to factor the expression out+
*/



var log_solve = true




function numeric_solve(exp){


    var exp_vars = get_all_vars(exp)
    if (exp_vars.length!==1){throw "can only have one variable, has multiple: "+exp_vars}
    var solve_var = exp_vars[0]



    
    // in case newton raphson doesnt work:

    //var nerd_sols = nerdamer.solve(exp,solve_var).symbol.elements

    // nerdamer can be a bit weird with complex solutions but if there's only one solution it should be ok
    //if (nerd_sols.length===1){return nerd_sols[0].toString()}


    // otherwise use newton raphson

    var prev_guess
    var guess = 1
    var tol = 0.001

    var f = (x)=>{
        return math.evaluate(sub_all_vars(exp,solve_var,x.toString()))}

    function fprime(x) {
        var h = 0.001;
        return math.divide(math.subtract(f(math.add(x,h)),f(math.subtract(x,h))),2*h)
    }

    while (prev_guess===undefined || math.abs(math.subtract(guess,prev_guess))>tol){
        var new_guess = math.subtract(guess,math.divide(f(guess),fprime(guess)))
        var prev_guess = guess
        var guess = new_guess
        console.log(guess)
    }

    var real_comp =  math.re(guess)
    var im_comp = math.im(guess)

    if (im_comp>1e-10){throw "No real solutions"}
    
    return real_comp.toString()
}









function log_solve_step(msg){
    if (log_solve){console.log(msg)}
}


function remove_vars(eqns,vars_to_remove){

    if (vars_to_remove.length===0){return eqns} // sub_table still calls it even if there's nothing to be removed, so im just putting this case in immediately


    var exps = back_solve(eqns,vars_to_remove).sol
    if (exps.length===0){throw "this shouldnt happen, there should always be at least one eqn remaining in backsolve"}
    if (get_all_vars(exps).length===0){throw "removed too much"}

    /*


    if there's only one equation, backsolve will terminate even if there's variables still left
        this is for solving system can leave one equation with any variable at all

    however, this should throw an error


    */

    var all_sol_vars = get_all_vars(exps)
    var extra_vars = all_sol_vars.filter(exp_var=>{return vars_to_remove.includes(exp_var)})

    if (extra_vars.length!==0){
        if (exps.length==1){throw "also removed too much"}
        else{throw "this shouldnt happen, should only have extra if theres one equation (check how backsolve exited loop)"}
    }



    var eqns = exps.map(exp=>{
        return exp+"=0"
    })
    return eqns  
}

function solve_eqns(eqns){

   /*
    var non_vis_eqns = []

    var vis_sub = []
    eqns.forEach(eqn=>{
        var eqn_vars = get_all_vars(eqn)



        var vis_vars = eqn_vars.filter(eqn=>{
            return eqn_var.includes("dummy")
        })

        if (vis_vars.length>1){throw "eqn should only have one visual variable, not sure whats going on"}


        else if (vis_vars.length==1){
            
        }
        else{non_vis_eqns.push(eqn)}
    })

    */


    var result = back_solve(eqns,get_all_vars(eqns))
    var final_exps = result.sol
    var ordered_sub = result.sub_order

    if (final_exps.length>1){throw "this shouldnt happen???"}   // this can happen with multiple equations that both reduce to 0
    var final_exp = final_exps[0]

    var all_vars = get_all_vars(final_exp)
    if (all_vars.length===0){throw "contradiction?"}    // i think you need to check if the value is 0
    else if(all_vars.length>1){throw "too much unknown"}
    var solve_var = all_vars[0]

    var sol = numeric_solve(final_exp)

    ordered_sub.push({var:solve_var,exp:sol})

    var computed_sub = forward_solve(ordered_sub)

    var sols = computed_sub.map(sol=>{
        var frac = sol.exp
        var frac_comps = frac.split("/")
        if (frac_comps.length===1){var val = frac_comps[0]}
        else{var val = frac_comps[0]/frac_comps[1]}
        return sol.var+"="+val
    })

    // var sols = direct_sols.concat(sub_sols)

    return sols


}

function forward_solve(ordered_sub){


    /*

    ordered_sub is returned in back_solve has the sub order
    the last one created in solve_eqns with the final numeric value

    */

    ordered_sub.reverse()

    for (let sub_i=0;sub_i<ordered_sub.length;sub_i++){
        var sub = ordered_sub[sub_i]
        var val = nerdamer.expand(sub.exp).toString()
        if (get_all_vars(val).length!==0){throw "couldnt evaluate"}
        sub.exp = math.evaluate(val).toString()    // this is necessary for trig functions
        for (let replace_i=sub_i+1;replace_i<ordered_sub.length;replace_i++){
            var next_sub = ordered_sub[replace_i]
            next_sub.exp = sub_all_vars(next_sub.exp,sub.var,val)
        }
    }
    return ordered_sub

}

function back_solve(eqns,remove_vars){

    var exps = eqns.map(eqn=>{
        sides = eqn.split("=")
        return sides[0]+"-("+sides[1]+")"
    })


    var ordered = []
    var all_vars = get_all_vars(exps)
    var keep_vars = all_vars.filter(test_var=>{return !(remove_vars.includes(test_var))})
    var substitutions = []      // this one will be added to (not strictly necessary though)
    var exp_left = true
    while (exp_left && exps.length>1){  // if its solving the system, all the variables are to remove but it should terminate after one equation
        // i dont need to put it in a try block cause if it cant sub out that error can rise up to the user so it should just pass through here
        var exps_cleaned = remove_uneeded_exps(exps)
        var exps = sub_out(exps)
        var exp_left = exps.some(exp=>{
            var all_vars = get_all_vars(exp)
            return all_vars.some(test_var=>{return remove_vars.includes(test_var)})
        })
    }
    return {sol:exps,sub_order:ordered}

    // this could be done repeatedly until theres no change
    function remove_uneeded_exps(exps){
        if (exps.length===1){return exps}    // if theres only one expression and only one variable to solve for, this function would remove it if it werent for this
        var all_vars = get_all_vars(exps)
        var vars_to_keep = []
        var vars_to_remove = []
        all_vars.forEach(test_var=>{
            if (remove_vars.includes(test_var)){
                vars_to_remove.push(test_var)
            }else{
                vars_to_keep.push(test_var)
            }
        })

        var needed_exps = exps.filter(exp=>{
            var all_vars = get_all_vars(exp)
            var exp_vars_remove = all_vars.filter(test_var=>{return vars_to_remove.includes(test_var)})
            //if (exp_vars_remove.length===1){
               

            for (let var_i=0;var_i<exp_vars_remove.length;var_i++){
                var exp_var_remove = exp_vars_remove[var_i]
                var exps_including = exps.filter(exp=>{return get_all_vars(exp).includes(exp_var_remove)})
                if (exps_including.length===1){
                    log_solve_step(exp+" eliminated since it cant be subbed")
                    return false
                }
            }
            return true
        })
        return needed_exps
    }

    function sub_out(exps){
        function get_exp_complex(exp){
            // for now just bases complexity of number of operations
            var exp_arr = exp.split("")
            var op_arr = exp_arr.filter(char=>{return ["*","-","+","/","^"].includes(char)})
            return op_arr.length
        }
        var sorted_exps = exps.sort((a,b)=>{
            var a_complex = get_exp_complex(a)
            var b_complex = get_exp_complex(b)  
            if (a_complex>b_complex){return 1}
            if (b_complex>a_complex){return -1}
            return 0
        })
        log_solve_step("remaining expressions sorted: ");log_solve_step(sorted_exps)
        var factored
        for (var exp_i=0;exp_i<sorted_exps.length;exp_i++){
            try{
                var factored = solve_exp(exps[exp_i])
                break
            }catch(e){
                if (e.type==="solve for"){
                    log_solve_step("couldnt solve for any variables in "+exps[exp_i])
                    continue
                }
                else{
                    throw e
                }
            }
        }
        if (factored===undefined){
            // at this point i think solving would fail, and would send an error to the user
            throw "no expressions could be subbed for"
        }
        
        var exp_subbed = sorted_exps[exp_i]
        var exps_removed_sub = deep_copy(sorted_exps)
        exps_removed_sub.splice(exp_i,1)
        var base_pow = factored["base"]
        if (factored.other===[]){
            // this is a case like 5*x=0 where x would just be 0
            var unfactored = "0"
        }else{
            var unfactored = tree2exp(factored["other"])
        }
        if (factored["factored"][0].length===0){
            var factored_out = 1
        }else{
            var factored_out = tree2exp(factored["factored"])
        }
        var subbed_var = base_pow[0]
        var pow = nerdamer.expand(base_pow[1]).toString()
        //if (Number(pow)!==1){throw "for now, i thought the power for the variable im factoring had to be 1????"}
        if (!(get_all_vars(exp_subbed).includes(subbed_var))){throw "not solving for a variable??"}

   
    

        // this could be done without a branch obviously but im afraid it would be harder to simplify

        var inverse_pow = 1/pow
        var solved_exp = "-1*("+unfactored+")^("+inverse_pow+")*("+factored_out+")^((-1)*"+inverse_pow+")"


/*
        if (pow==="1"){
            var solved_exp = "-1*("+unfactored+")*("+factored_out+")^(-1)"
        }else if (pow==="-1"){
            var solved_exp = "-1*("+factored_out+")*("+unfactored+")^(-1)"
        }else{
            throw "Neither????"
        }
     */   


        if (get_all_vars(solved_exp).includes(subbed_var)){
            throw "solved expression cant include a subbed var"
        }

        log_solve_step("solved for "+subbed_var+" : "+solved_exp)
        ordered.push({var: subbed_var, exp: solved_exp})
        var exps_subbed = exps_removed_sub.map(exp=>{
            var subbed_out =  sub_all_vars(exp,subbed_var,solved_exp)
            var start = Date.now()
            var result = nerdamer.expand(subbed_out).toString()
            var end = Date.now()
            console.log(end-start)
            console.log(subbed_out)
            return result
        })
        return exps_subbed
    }

    function solve_exp(exp){    
        /*
            returns the same factor dictionary, but for only the winning variable
        */
        var all_vars = get_all_vars(exp)
        var all_vars_to_sub = all_vars.filter(eqn_var=>{return remove_vars.includes(eqn_var)})
        var tree = exp2tree(exp)
        var possible_factors = []
        all_vars_to_sub.forEach(test_var=>{
            try{
                var copied_tree = deep_copy(tree)
                possible_factors.push(factor(copied_tree,test_var))
            }catch(e){
                if (e.type==="factor"){
                    log_solve_step("solving for "+test_var+" failed because: "+e.error)
                    return
                }
                else{throw e}
            }
        })
        if (possible_factors.length===0){
            throw solve_for_error("could not solve for any variable")
        }
        //! an exponent of -1 is also fine
        var no_exp_factors = possible_factors.filter(factor=>{
            var exp_raw = factor["base"][1]
            var start = Date.now()
            var exp = Number(nerdamer.expand(exp_raw).toString())
            var end = Date.now()
            console.log(end-start)
            console.log(exp_raw)
            var simple_num = !(tree2exp(factor.other).includes("+"))
            var simple_dem = !(tree2exp(factor.factored).includes("+"))
            return ((simple_num && simple_dem) || (exp===1 || exp===2) && simple_dem)||(exp===-1 && simple_num)
        })
        if (no_exp_factors.length===0){
            throw solve_for_error("solving for any requires negating an exponent")
        }
        return no_exp_factors[0]
    }
}

function factor(tree,sel_var){
    var tree_without_term = []
    var tree_with_term = []
    tree.forEach(sum_term=>{
        var sum_term_with_var = sum_term.filter(prod_term=>{
            var exp_base = prod_term[0]
            var exp = prod_term[1]
            if (prod_term.length!==2 || typeof exp_base!=="string" || typeof exp!=="string"){throw "oops"}
            var contains_sel_var = get_all_vars(exp_base).includes(sel_var)
            if (contains_ops(exp_base) && contains_sel_var){throw factor_error("cant isolate variable: "+exp_base)}
            return contains_sel_var
        })
        if (sum_term_with_var.length>1){
            throw "this shouldnt happen at all, might not have been expanded properly: "+tree2exp(tree)
        }
        else if (sum_term_with_var.length===0){tree_without_term.push(sum_term)}
        else if(sum_term_with_var.length===1){tree_with_term.push(sum_term)}
        else{throw "wut"}
    })
    if (tree_without_term.length===0 && contains_ops(tree2exp(tree_with_term))){
        throw factor_error("factored everything out")}
    if (tree_with_term.length===0){
        throw factor_error("couldnt factor")
    }

    var base
    // this is modifying tree_with_term (factoring stuff out during splice)
    tree_with_term = deep_copy(tree_with_term)
    tree_with_term.forEach(sum_term=>{
        sum_term.forEach((prod_term,idx)=>{
            if (prod_term[0]!==sel_var){return}

            if (base===undefined){
                base = prod_term
            }else if (JSON.stringify(base)!==JSON.stringify(prod_term)){
                throw factor_error("different exponents: "+base+" vs "+prod_term)
            }
            sum_term.splice(idx,1) 
        })
    })
    if (base===undefined){
        throw "wut"
    }
    return {
        "base": base,
        "factored": tree_with_term,
        "other": tree_without_term
    }
}

function tree2exp(tree){
    var sum_terms = tree.map(sum_term=>{
        var str_prod_terms = sum_term.map(prod_term=>{
            if (prod_term.length!==2){throw "incorrect number of exponent terms"}
            return prod_term[0]+"^"+prod_term[1]
        })
        return str_prod_terms.join("*")
    })
    var exp0 = sum_terms.join("+")

    var start = Date.now()
    var result = nerdamer.expand(exp0).toString()
    var end = Date.now()
    console.log(end-start)
    console.log(exp0)
    return result
}



// obv have to replace - with (-1)* which ive already done


// the profiler says math is the main weight but the timer is saying this one (parsing without math) is actually slower, i dont get why :(
function exp2tree(exp0){
    var start = Date.now()
    var exp = nerdamer.expand(exp0).toString()
    var end = Date.now()
    console.log(end-start)
    console.log(exp0)

    exp = exp.replaceAll("-","+(-1)*")

    if (exp[0]==="+"){
        exp=exp.slice(1)
    }

    var sum_terms = exp_split(exp,"+")

    var tree = sum_terms.map(term=>{
        var prod_terms = exp_split(term,"*")
        return prod_terms.map(term=>{
            return exp_split(term,"^")
        })
    })

    tree.forEach(sum_term=>{
        sum_term.forEach(prod_term=>{
            if (prod_term.length!==2){throw "incorrect shape"}
            prod_term.forEach(exp_term=>{
                if (typeof exp_term!=="string"){throw "too many layers"}
            })
            if (get_all_vars(prod_term[1]).length!==0){throw "exponent cannot have variables"}

        })
    })   
    return tree
}

function exp_split(str,op){
    var str = strip_outer_paren(str)
    var op_idxs = getAllIndexes(str,op)
    var outer_op_idxs = op_idxs.filter(idx=>{return get_depth(str,idx)===0})
    var split_str = []
    for (let i=0;i<outer_op_idxs.length+1;i++){
        var idx1,idx2
        if (i===0){idx1 = 0}
        else {idx1 = outer_op_idxs[i-1]+1}
        if (i===outer_op_idxs.length){idx2 = str.length}
        else {idx2 = outer_op_idxs[i]}   
        split_str.push(str.slice(idx1,idx2))
    }
    if (split_str.length===1 && op!=="+"){split_str.push("1")}
    return split_str
}

function getAllIndexes(arr, val) {
    var indexes = []
    for(let i = 0; i < arr.length; i++)
        if (arr[i] === val)
            indexes.push(i);
    return indexes;
}

function strip_outer_paren(str){
    if (str[0]!=="(" || str[str.length-1]!==")"){return str}
    var depth = 0 
    for (let i=0;i<str.length-1;i++){   // one less because at the last parentheses the depth would reach back to 0, want to check if it does before that
        var char = str[i]
        if (char==="("){depth = depth+1}
        else if (char===")"){depth = depth-1}

        if (depth===0){return str}
    }
    return str.slice(1,str.length-1)  // if it never returned back to 0 depth it means the parentheses enclose the expression so they should be stripped out
}

function get_depth(str,idx){
    var depth = 0
    for (let i=0;i<idx;i++){
        var char = str[i]
        if (char==="("){depth = depth+1}
        else if (char===")"){depth = depth-1}
    }
    return depth
}

function exp2tree_with_math_parser_not_used(exp0){
    /*
     THIS WILL NOT WORK WHEN THE FRACTIONS GET TO LARGE

     THE MATH PARSER WILL CONVERT THE NUMBERS TO SCI NOTATION, ADDING E

     DO NOT USE AS IS

     WITHOUT MATH ONE SHOULD ANYWAY BE MUCH FASTER

    */
    
    
    var exp = nerdamer.expand(exp0).toString()
    exp = exp.replaceAll("-","+(-1)*")
    if (exp[0]==="+"){
        exp=exp.slice(1)
    }
    var math_tree = math.parse(exp)
    var tree = pull_sum_terms(math_tree)
    // this is just checking the structure, only throws errors
    tree.forEach(sum_term=>{
        sum_term.forEach(prod_term=>{
            if (prod_term.length!==2){throw "incorrect shape"}
            prod_term.forEach(exp_term=>{
                if (typeof exp_term!=="string"){throw "too many layers"}
            })
            if (get_all_vars(prod_term[1]).length!==0){throw "exponent cannot have variables"}
        })
    })
    return tree
    function pull_sum_terms(tree0){
        var sum_terms = []
        step_down_tree(tree0)
        function step_down_tree(tree){
            var args = tree["args"]
            if (["+","-"].includes(tree["op"])){
                if (args.length!==2){throw "not two operations for sum??"}
                args.forEach(sub_tree=>{
                    step_down_tree(sub_tree)
                }) 
            }
            else{
                sum_terms.push(pull_product_terms(tree))
            }
        }
        return sum_terms
    }
    function pull_product_terms(tree0){
        var product_terms = []
        step_down_tree(tree0)
        function step_down_tree(tree){
            if (tree["op"]==="*"){
                var args = tree["args"]
                if (args.length!==2){throw "not two operations for product??"}

                args.forEach(sub_tree=>{
                    step_down_tree(sub_tree)
                }) 
            }else{
                product_terms.push(pull_exp_terms(tree))
            }
        }
        return product_terms
    }
    function pull_exp_terms(tree){

        if (tree["op"]==="^"){
            var args = tree["args"]
        }else{
            var args = [tree,"1"]
        }
        var terms = args.map(arg=>{return arg.toString().replaceAll(" ","")})
        return terms
    }

}


function contains_vars(exp){
    return /[a-zA-Z]/g.test(exp)
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

function contains_ops(exp){
    // returns true if any nonalphanumeric characters but there are also variables
    if (!contains_vars(exp)){return false}
    return !(/^[a-z0-9_]+$/i.test(exp))
}

function factor_error(msg){
    return {type:"factor",error:msg}
}

function solve_for_error(msg){
    return {type:"solve for",error:msg}
}

function sub_out_error(msg){
    return {type:"sub out",error:msg}
}


function time_it(operation,parameters,n_times){
    var start = Date.now()
    for (let i=0;i<n_times;i++){
        operation(...parameters)
    }
    var end = Date.now()
    var time = (end-start)/1000/n_times
    console.log("took "+time+" seconds for one operation")
}



function deep_copy(arr){

    return JSON.parse(JSON.stringify(arr))
}







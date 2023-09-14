/*

works fairly well, but using nerdamer instead of my own cas

makes it very difficult to make it show the equations i want
also (probably...) slower (since now i dont need to construct and deconstruct trees over and over again)
also just harder to make sense of things
and this is overall a mess cause i did include code to factor terms in very basic cases
now thing's are just nicer and simpler :)

*/


// for performing unit tests
const testing = false

if (testing){
    var nerdamer = require('nerdamer/all.min.js')
    var math = require("mathjs")
}


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
    const max_count = 100

    var f = (x)=>{
        return math.evaluate(
            sub_all_vars(exp,solve_var,x.toString())
        )
    }

    function fprime(x) {
        var h = 0.001;
        return math.divide(math.subtract(f(math.add(x,h)),f(math.subtract(x,h))),2*h)
    }

    var iter_count = 0
    while (prev_guess===undefined || math.abs(math.subtract(guess,prev_guess))>tol){
        var new_guess = math.subtract(guess,math.divide(f(guess),fprime(guess)))
        var prev_guess = guess
        var guess = new_guess
        console.log(guess)
        iter_count+=1

        if (iter_count>max_count || isNaN(guess)){
            throw "Cannot find solution, possibly no real solutions"
        }
    }

    var real_comp =  math.re(guess)
    var im_comp = math.im(guess)

    if (im_comp>1e-10){throw "No real solutions"}
    
    return real_comp.toString()

}



function remove_vars(eqns,vars_to_remove){

    if (vars_to_remove.length===0){return eqns} // sub_table still calls it even if there's nothing to be removed, so im just putting this case in immediately



    let exps = eqns_to_exps(eqns)
    let ordered_sub = []


    let remove_var_exps

    while (true){


        // instead checking if the variables share any of vars_to_remove

        

        let other_exps

        let remove_var_exps = []

        let needed_exps = []

        exps.forEach((exp,idx)=>{

            const exp_vars = get_all_vars(exp)


            other_exps = [...exps]

            other_exps.splice(idx,1)


            const other_vars = get_all_vars(other_exps)


            const has_common_vars = arr_share_values(exp_vars, other_vars)

            const has_remove_vars = arr_share_values(exp_vars,vars_to_remove)

            const sub_out_exp = has_common_vars && has_remove_vars

            const is_visual = exp.includes("VISUAL")

            if (sub_out_exp && !is_visual){
                remove_var_exps.push(exp)
            }

            if (sub_out_exp || !has_remove_vars || is_visual){
                needed_exps.push(exp)
            }

        })
    

        exps = needed_exps


        if (remove_var_exps.length === 0){   // checking before sub_out since it's possible they're all single variable equations which can't be solved for at the beginning
            break
        }

        [exps,ordered_sub] = sub_out(exps, ordered_sub, vars_to_remove)

    }




    if (exps.length===0){
        throw "no equations left"
    }

    /*


    if there's only one equation, backsolve will terminate even if there's variables still left
        this is for solving system can leave one equation with any variable at all

    however, this should throw an error


    */


    const vis_exps = exps.filter(exp=>{return exp.includes("VISUAL")})
    const vis_exps_remove_vars = vis_exps.filter(exp=>{
        const exp_vars = get_all_vars(exp)
        return arr_share_values(exp_vars,vars_to_remove)
    })

    /* @code
    if (vis_exps_remove_vars.length!==0){
        throw "Visual would be lost with removed variables" // TODO cleanear error message
    }
    */


    exps.forEach(exp=>{
        const sol_vars = get_all_vars(exp)
        
        const extra_vars = sol_vars.filter(exp_var=>{return vars_to_remove.includes(exp_var)})
        const is_visual = exp.includes("VISUAL")

        if (extra_vars && !is_visual){
            throw `shouldnt happen, variables ${extra_vars} should have been removed from ${exp}`
        }

        if (extra_vars && is_visual){
            const vis_name = sol_vars.filter(test_var=>{return test_var.includes("VISUAL")})[0].replace("VISUAL","")
            throw `removing variables ${extra_vars} from the ${vis_name} would cause the visual to be lost`
        }
    })


    var eqns = exps.map(exp=>{
        if (exp.includes("VISUAL")){return exp}
        return exp+"=0"
    })
    return eqns  
}

function solve_eqns(eqns){

    /* @code
    // var result = back_solve(eqns,get_all_vars(eqns))
    // var final_exps = result.sol
    // var ordered_sub = result.sub_order
    


    // if (final_exps.length>1){throw "this shouldnt happen???"}   // this can happen with multiple equations that both reduce to 0
    */

    // instead of calling back_solve:

    // some of this will have to be done in remove_vars as well, but i think it's ok

    let exps = eqns_to_exps(eqns)
    let ordered_sub = []


    const all_vars = get_all_vars(eqns)

    while (true){

        multi_var_exps = exps.some(exp=>{
            const n_vars = get_all_vars(exp).length
            if (n_vars===0){throw "SHOULD NOT HAPPEND -- should have been removed in sub_out"}
            return n_vars > 1
        })

        if (!multi_var_exps){   // checking before sub_out since it's possible they're all single variable equations which can't be solved for at the beginning
            break
        }

        [exps,ordered_sub] = sub_out(exps,ordered_sub, all_vars)

    }

    const final_exps = exps



    // wont necessarily be the first one, could have multiple

    // can map over all final exps instead

    // final exps --> final_sub
    //      then push to ordered_sub


    const final_sub = final_exps.map(exp=>{

        const all_vars = get_all_vars(exp)

        if(all_vars.length !== 1){
            throw "too many or too few unknowns SHOULD NOT HAPPEN -- should have not escaped while loop"
        }


        const solve_var = all_vars[0]
        
        const sol = numeric_solve(exp)

        return {var: solve_var, exp: sol}
    })


    /*
    
    check for contradictions between the results if there's multiple numeric solves:


    could group into vars and then check if they all match for each

    or could just loop through and check for override
        create array of vars

    */


    let subbed = {}

    final_sub.forEach(sub=>{

        const sub_var = sub.var
        const sub_value = sub.exp

        const subbed_vars = Object.keys(subbed)
        const already_subbed = subbed_vars.some((subbed_var)=>{return subbed_var===sub_var})
    
        if (already_subbed){
            if (subbed[sub_var] !== sub_value){
                throw "contradiction"
            }
        }else{
            subbed[sub_var] = sub_value
        }
    })


    ordered_sub = ordered_sub.concat(final_sub)


    const computed_sub = forward_solve(ordered_sub)


    // var sols = direct_sols.concat(sub_sols)

    return computed_sub


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
        if (get_all_vars(val).length!==0){throw "cannot solve (error on forward solve)"}
        sub.exp = math.evaluate(val).toString()    // this is necessary for trig functions
        for (let replace_i=sub_i+1;replace_i<ordered_sub.length;replace_i++){
            var next_sub = ordered_sub[replace_i]
            next_sub.exp = sub_all_vars(next_sub.exp,sub.var,val)
        }
    }
    return ordered_sub

}




function sub_out(exps, ordered, vars_to_remove){
    function get_exp_complex(exp){
        // for now just bases complexity of number of operations
        var exp_arr = exp.split("")
        var op_arr = exp_arr.filter(char=>{return ["*","-","+","/","^"].includes(char)})
        return op_arr.length
    }

    function exp_complex_sort(a,b){
        var a_complex = get_exp_complex(a)
        var b_complex = get_exp_complex(b)  
        if (a_complex>b_complex){return 1}
        if (b_complex>a_complex){return -1}
        return 0
    }

    const keep_var_exps = []
    const no_keep_var_exps = []

    exps.forEach(exp=>{
        const all_vars = get_all_vars(exp)

        const has_vars_to_keep = all_vars.some(sel_var=>{return !vars_to_remove.includes(sel_var)})

        if (has_vars_to_keep){
            keep_var_exps.push(exp)
        }else{
            no_keep_var_exps.push(exp)
        }
    })

   // const sorted_keep_exps = keep_var_exps.sort(exp_complex_sort)
    //const sorted_no_keep_exps = no_keep_var_exps.sort(exp_complex_sort)


    //const sorted_exps = sorted_keep_exps.concat(sorted_no_keep_exps)
    const sorted_exps = exps.sort(exp_complex_sort)
    log_solve_step("remaining expressions sorted: ");log_solve_step(sorted_exps)
    let exp
    let factored
    for (var exp_i=0;exp_i<sorted_exps.length;exp_i++){
        exp = sorted_exps[exp_i]
        if (exp.includes("VISUAL")){continue}
        try{
            factored = solve_exp(exp, vars_to_remove)
            break
        }catch(e){
            if (e.type==="solve for"){
                log_solve_step("couldnt solve for any variables in "+sorted_exps[exp_i])
                continue
            }
            else{
                throw e
            }
        }
    }
    if (factored===undefined){
        // at this point i think solving would fail, and would send an error to the user
        throw "cannot solve for any variables"
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
    if (!(get_all_vars(exp_subbed).includes(subbed_var))){
        throw "not solving for a variable??"
    }




    var inverse_pow = 1/pow
    var solved_exp = "-1*("+unfactored+")^("+inverse_pow+")*("+factored_out+")^((-1)*"+inverse_pow+")"







    const step_before = math_to_ltx(exp+"=0")
    const step_after = math_to_ltx(subbed_var+"="+nerdamer.expand(solved_exp))
    
    const s2 = "\\ \\ "
    const solve_step = `\\text{Solving} ${s2} ${step_before} ${s2} \\text{for} ${s2} ${math_to_ltx(subbed_var)}: ${s2} ${step_after}`

    add_solve_step([solve_step])
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


    const exps_subbed = exps_removed_sub.map(exp=>{
        var subbed_out =  sub_all_vars(exp,subbed_var,solved_exp)
        var start = Date.now()
        if (subbed_out.includes("VISUAL")){var result = subbed_out}
        else{
            var result = nerdamer.expand(subbed_out).toString()
        }
        var end = Date.now()
        console.log(end-start)
        console.log(subbed_out)
        return result
    })


    // TODO for all these checks, only apply them on the ones that have actually been subbed for

    let exps_vars_subbed = exps_subbed.filter(exp=>{


        const no_vars = get_all_vars(exp).length === 0

        const is_visual = exp.includes("VISUAL")

        if (!no_vars || is_visual){
            return true
        }

        let tolerance = 5

        let final_value = parseFloat(exp)
        const rounded_value = Math.round(final_value * 10 ** tolerance) / 10 ** tolerance;




        if (rounded_value !== 0){
            throw "contradiction"
        }
        return false
    })




    /*

    remove common factors, this prevents it from coming up as a variable to solve for, e.g. a*b+a*c

    */

    exps_vars_subbed = exps_vars_subbed.map(exp=>{

        if (exp.includes("VISUAL")){return exp}

        return remove_common_terms(exp)
    })

    const eqn_steps = []
    const n_exps = exps_removed_sub.length
    for (let i=0;i<n_exps;i++){
        let exp_before = exps_removed_sub[i]
        let exp_after = exps_subbed[i]

        const actually_subbed = get_all_vars(exp_before).includes(subbed_var)
        const not_visual = !exp_before.includes("VISUAL")

        if (! (actually_subbed && not_visual)){continue}


        const eqn_before = math_to_ltx(exp_before+"=0")


        const eqn_after = math_to_ltx(exp_after+"=0")

        eqn_steps.push(eqn_before+"\\ \\  \\Rightarrow \\ \\ "+eqn_after)
    }


    add_solve_step(eqn_steps)

    return [exps_vars_subbed, ordered]

}

function solve_exp(exp, vars_to_remove){    
    /*
        returns the same factor dictionary, but for only the winning variable
    */
    var all_vars = get_all_vars(exp)
    var all_vars_to_sub = all_vars.filter(eqn_var=>{return vars_to_remove.includes(eqn_var)})
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
    var no_exp_factors = possible_factors.filter(factor=>{
        var exp_raw = factor["base"][1]
        var start = Date.now()
        var exp = Number(nerdamer.expand(exp_raw).toString())
        var end = Date.now()
        console.log(end-start)
        console.log(exp_raw)
        var simple_num = !(tree2exp(factor.other).includes("+"))
        var simple_dem = !(tree2exp(factor.factored).includes("+"))
        const odd_exp = exp%2 !== 0
        return ((simple_num && simple_dem && odd_exp) || (exp===1) && simple_dem)||(exp===-1 && simple_num)
    })
    if (no_exp_factors.length===0){
        throw solve_for_error("solving for any requires negating an exponent")
    }
    return no_exp_factors[0]
}













function log_solve_step(msg){
    if (log_solve){console.log(msg)}
}


function eqns_to_exps(eqns){
    let exps = eqns.map(eqn=>{
        if (eqn.includes("VISUAL")){return eqn}
        sides = eqn.split("=")
        return sides[0]+"-("+sides[1]+")"
    })
    return exps
}




function add_solve_step(array) {

    // if im doing unit testing, i cant access the dom
    if (testing){
        return
    }
    

    // Get reference to the table element in the DOM
    //var table = $('#solve-steps')[0]

    const table = $("#solve-steps")[0]
    // Create a new row element
    const new_row = document.createElement("div")
    new_row.style.display = "flex"
    table.appendChild(new_row);
    
    // Iterate over the array elements and populate the row cells
    for (var i = 0; i < array.length; i++) {
        // Create a new cell for each element in the array
        const cell = document.createElement("div")
        new_row.appendChild(cell);

        cell.style.padding = "10px"
    
        var field = document.createElement("div")
        // Set the cell content to the array element
        

        // var eqn = math_to_ltx(array[i])
        
        var eqn = array[i]

        field.innerHTML = eqn;

        field.className = "eqn-field"

        cell.appendChild(field)
        
        
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


function remove_common_terms(exp){

    const tree = exp2tree(exp)

    // if it's only one term, this would cancel everything out
    // e.g b (meaning b=0) would just become 0 (meaning nothing)
    if (tree.length === 1){return exp}

    const branch0 = tree[0]

    const common_terms = branch0.filter(term=>{
        const all_matched = tree.every(other_branch=>{
            const matched_term = other_branch.some(other_term=>{
                return same_vals(term,other_term)
            })
            return matched_term
        })
        return all_matched
    })

    common_terms.forEach(term=>{
        tree.forEach(branch=>{
            const remove_idxs = []
            branch.forEach((other_term,idx)=>{
                if (same_vals(term,other_term)){
                    remove_idxs.push(idx)
                }
            })
            remove_idxs.reverse()
            remove_idxs.forEach(idx=>{
                branch.splice(idx,1)
            })
        })
    })

    function same_vals(arr1,arr2){
        return (JSON.stringify(arr1)===JSON.stringify(arr2))
    }

    return tree2exp(tree)
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


function get_all_vars(eqns,check_imag = true){
    const trig_funcs = ["sin", "cos", "tan", "csc", "sec", "cot", "sinh", "cosh", "tanh", "csch", "sech", "coth"]
    const inv_trig_funcs = ["asin", "acos", "atan", "acsc", "asec", "acot", "asinh", "acosh", "atanh", "acsch", "asech", "acoth"]

    var exclude = ["sqrt","pi"].concat(trig_funcs).concat(inv_trig_funcs)
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

    let all_vars = [...new Set(vars.flat())]
    
    if (all_vars.includes("i") && check_imag){
        throw "imaginary number i found"
    }

    all_vars = all_vars.filter(test_var=>{return !test_var.includes("VISUAL")})
    
    return all_vars
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


// probably wont use it
function get_arr_excess(arr1,arr2){
    const set1 = new Set(arr1)
    const set2 = new Set(arr2)
    // elements in set1 but not set2
    return [...set1].filter(el=>{return !set2.has(el)})
}


function arr_share_values(array1, array2) {
    for (let i = 0; i < array1.length; i++) {
      if (array2.includes(array1[i])) {
        return true; // Found a common value
      }
    }
    return false; // No common values found
  }
  

function deep_copy(arr){

    return JSON.parse(JSON.stringify(arr))
}





if (testing){
    module.exports = {solve_eqns}
}

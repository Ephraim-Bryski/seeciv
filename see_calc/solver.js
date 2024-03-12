
class ContradictionError extends Error {
    constructor (){
        super("Contradiction found in the system")
    }
    
}

class CantSolveError extends Error {
    constructor (){
        super("Unable solve the system any further This could be due to too many unknowns or just a limitation of the solver")
    }
}

class AlreadyDone extends Error {
    constructor (){
        super("just a stupid hack fix, findsolution can eliminate all the variables to remove, so it then should exit out of backsolve entirely")
    }
}


class NumericSolveError extends Error {
    constructor (message){
        super(message)
    }
}

class TooMuchUnknownError extends Error {
    constructor (){
        super("Too much unknown to solve the system")
    }
}




function remove_vars(SoEs, vars_to_remove){

    // TODO honestly might be better not to simplify the soes
    if (vars_to_remove.length === 0){
        

        const simplified_SoEs = SoEs.map(eqn => {

            if (eqn.includes("VISUAL")){
                return eqn
            }

            const tree = eqn_to_tree(ltx_to_math(eqn))
            const simplified_tree = simplify_tree(tree)
            return tree_to_eqn(simplified_tree, true)
        })
        return simplified_SoEs
    }







    const back_solution = back_solve(SoEs, vars_to_remove, false, false)


    const remaining_trees = back_solution.remaining_trees
    const steps = back_solution.steps
    
    const final_eqns = remaining_trees.map(tree => {return tree_to_eqn(simplify_tree(tree), true)})
    


    const visual_eqns = final_eqns.filter(eqn => {return eqn.includes("VISUAL")})
    const nonvisual_eqns = final_eqns.filter(eqn => {return !visual_eqns.includes(eqn)})
    const visual_vars = get_all_vars(visual_eqns)
    const nonvisual_vars = get_all_vars(nonvisual_eqns)

    vars_to_remove.forEach(remove_var => {
        const in_visual_eqns = visual_vars.includes(remove_var)
        const in_nonvisual_eqns = nonvisual_vars.includes(remove_var)

        if (in_visual_eqns){
            throw new FormatError("variables removed from visual, should this be a too much unknown error?")
        }
        if (in_nonvisual_eqns){
            throw "this doesnt make sense, variables should have been removed"
        }
    })


    return final_eqns
}

function solve_eqns(SoEs){



    const vis_eqns     = SoEs.filter(eqn=>{return eqn.includes("VISUAL")})
    const non_vis_eqns = SoEs.filter(eqn=>{return !eqn.includes("VISUAL")})

    const vars_with_vis = get_all_vars(SoEs)


    let vars_to_remove = get_all_vars(non_vis_eqns)

    const extra_vis_vars = vars_with_vis.filter(vis_var => {return !vars_to_remove.includes(vis_var)})

    if (extra_vis_vars.length !== 0){
        //VAR
        throw new FormatError(`You need to substitute a value for visual variables: ${extra_vis_vars.join(",")}`)
    }



    const back_solution = back_solve(SoEs, vars_to_remove, true, false)

    const ordered_sub = back_solution.ordered_sub

    
    GLOBAL_solve_stuff.previous_back_solution = back_solution
    

    const back_steps = back_solution.steps

    const forward_solution = forward_solve(ordered_sub)
        

    const solutions = forward_solution.solution
    const forward_steps = forward_solution.steps

    const solve_vars = solutions.map(sol => {return sol.solve_var})
    const solve_exps = solutions.map(sol => {return sol.sol})


    
    
    
    const all_solved = vars_to_remove.every(remove_var => {return solve_vars.includes(remove_var)})
    if (!all_solved){
        console.log("check this")
        throw new TooMuchUnknownError
    }

    const result = solutions.map(sol => {
        return sol.solve_var+"="+sol.sol
    })

    const solved_vis_eqns = vis_eqns.map(eqn=>{
        solve_vars.forEach((_,i)=>{
            eqn = sub_all_vars(eqn,solve_vars[i],solve_exps[i])
        })
        return eqn
    })


    const steps = {back: back_steps, forward: forward_steps}
    //VIS no longer here
    //display_vis(solved_vis_eqns)
    return [result,steps]
}

function show_trees(trees){
    trees.forEach(tree => {
        if (tree === null){
            return
        }
        console.log(tree_to_eqn(tree))
    })
}

function back_solve(SoEs_with_vis, vars_to_remove, to_solve_system, in_tree_form){

        
    let vis_SoEs = SoEs_with_vis.filter(eqn => {return typeof eqn === "string" && eqn.includes("VISUAL")})
    

    const SoEs = SoEs_with_vis.filter(eqn => {return !vis_SoEs.includes(eqn)})

    // const SoEs = SoEs_with_vis.filter(SoE => {return !SoE.includes("VISUAL")})

    // doing this weird mapping for groupcommonterms and eqntotree cause otherwise the second default argument is undefined, cause javascript |:
    
    let trees_ungrouped
    if (in_tree_form){
        trees_ungrouped = SoEs
    }else{

        trees_ungrouped = SoEs.map(ltx_to_math).map(eqn => {return eqn_to_tree(eqn,true)})
    }
    

    const trees = trees_ungrouped.map(tree => {return group_common_terms(tree)}) // trees will be mutated in the backsolve scope
    
    
    
    
    
    const trees_info = trees.map(get_tree_info)          
    const trees_complexity = trees_info.map(info => {return info[0]})
    const trees_counts = trees_info.map(info => {return info[1]})
    const tree_idxs = trees.map((_, idx) => {return idx})   // this shouldnt be mutated, only read (just for convenience)
    
    const ordered_sub = []  // again only relevant for solving the system
    
    const solution_steps = []
    
    const use_ltx = true 
    
    while (true){  

        trim_trees()

        const solution = find_solution()

        if (solution === null){
            // either means it couldn't find a solution or there's nothing left to back solve
            break
        }

        const step = {
            eqn0: solution.eqn0,
            sol: tree_to_expression(solution.sol, use_ltx),
            solve_var: solution.solve_var
        }

        
        const tree_idxs_with_sol_var = tree_idxs.filter(idx => {
            return Object.keys(trees_counts[idx]).includes(solution.solve_var) && trees[idx] !== null
        })
    
        const solution_expression = tree_to_expression(solution.sol)


        ordered_sub.push({solve_var: solution.solve_var, sol: solution_expression})

        const substitution_steps = []
        tree_idxs_with_sol_var.forEach(idx => {
            const tree = trees[idx]
            const eqn0 = tree_to_eqn(tree, use_ltx)
            const subbed_tree_ungrouped = sub_in(tree, solution.solve_var, solution.sol)
            const subbed_tree = group_common_terms(subbed_tree_ungrouped)
            const eqn_subbed = tree_to_eqn(subbed_tree, use_ltx)
            substitution_steps.push({eqn0: eqn0, eqn_subbed: eqn_subbed})
            update_tree(subbed_tree, idx)
        })


        vis_SoEs = vis_SoEs.map(SoE => {
            return sub_all_vars(SoE, solution.solve_var, solution_expression)
        })


        step.substitutions = substitution_steps    // other assignments done earlier since subin mutates tree
    
        solution_steps.push(step)

        if (to_solve_system){
            GLOBAL_solve_stuff.steps.back.push(step)
        }
        

    }


    const solved_vis_SoEs = vis_SoEs.filter(eqn => {return get_all_vars(eqn).length === 0})

    // display_vis(solved_vis_SoEs)
    fuck_my_life_push_to_equation_visuals_but_check_first(solved_vis_SoEs)
    // equation_visuals.push(solved_vis_SoEs)

    // THIS is where it throws an error that it can't solve

    const remaining_trees = trees.filter(tree => {return tree !== null}).concat(vis_SoEs)
    const branching_trees = remaining_trees.filter(tree => {
        return tree.op === "*"
    })

    const nonbranching_trees = remaining_trees.filter(tree => {
        return !branching_trees.includes(tree)
    })
    

    const all_tree_vars = trees_counts.map((count,idx) => {
        return Object.keys(count)
    }).flat()


   
    const remaining_vars_to_remove = get_intersection(vars_to_remove, all_tree_vars)

    // could be done eariler by just checking length of branching subtrees
    const no_branches = branching_trees.length === 0


    const solved = remaining_vars_to_remove.length === 0


    const prebranch_solution = {remaining_trees: remaining_trees, ordered_sub: ordered_sub, steps: solution_steps}

    if (no_branches && solved){
        return prebranch_solution
    }

    if (no_branches && !solved){
        throw new CantSolveError
    }



    // now we know there are branches 

    
    const branching_subtrees = branching_trees.map(tree => {
        return tree.terms
    })




 

    const permutations = get_permutations(branching_subtrees)


    const possible_branches = permutations.map(permutation => {
        return nonbranching_trees.concat(permutation)
    })





    const nested_branched_solutions = []

    possible_branches.forEach(branch_tree => {
        try {
            // TODO could be made more efficient by not converting back to eqns instead have backsolve take trees but whatever /:
            // const branch_eqns = branch.map(tree => {return tree_to_eqn(tree)})
            const solution = back_solve(branch_tree, remaining_vars_to_remove, false, true)
            nested_branched_solutions.push(solution)
        }catch(e){
            if (e instanceof EvaluateError || e instanceof ContradictionError){
                return
            }
            throw e
        }
    })

    // at this point we KNOW that each of the branches already removed all the needed variables, or else it would have gotten an error


    let branched_solutions = nested_branched_solutions.flat()

    // a bit hacky but it's possible there are remaining equations that have contradictions that need to be filtered out
    branched_solutions = branched_solutions.filter(solution => {
        const trees = solution.remaining_trees

        const is_contradiction = (val)=>{return is_number(val) && !is_near_zero(val)}

        const has_contradictions = trees.some(is_contradiction)

        return !has_contradictions
    })


    
    function get_n_eqns(solution){

        // im not going to count equations like a=0 since they're usually the uninteresting solutions

        const nonzero_trees = solution.remaining_trees.filter(sol => {return typeof sol !== "string"})


        return nonzero_trees.length
    } 

    
    
    if (branched_solutions.length > 1){

        branched_solutions = branched_solutions.filter(solution => {

            if (solution.remaining_trees.length !== 1){
                return true
            }

            const solution_tree = solution.remaining_trees[0]
            
            const solution_tree_copy = JSON.parse(JSON.stringify(solution_tree))
            
            
            const simplified_tree = simplify_tree(solution_tree_copy)

            is_zero_solution = typeof simplified_tree === "string" && !simplified_tree.includes("VISUAL")

            return !is_zero_solution
        })
    
    }
    
    

    if (branched_solutions.length === 0){
        throw new ContradictionError
    }

    // TODO for now using the solution with the most eqns, probably not the best approach
    branched_solutions = sorted(branched_solutions,key = get_n_eqns)




    const branched_solution = branched_solutions[branched_solutions.length-1]

    const combined_solution = {}
    combined_solution.remaining_trees = branched_solution.remaining_trees
    combined_solution.ordered_sub = [prebranch_solution.ordered_sub, branched_solution.ordered_sub].flat()
    combined_solution.steps = [prebranch_solution.steps, branched_solution.steps].flat()

    return combined_solution

    
    
    function find_solution(){
    
        const sorted_trees_idxs = sort_idxs(trees_complexity)

        for (const tree_idx of sorted_trees_idxs){
    
            const tree = trees[tree_idx]             
            if (tree === null){continue}

            if (tree.op === "*"){
                continue}

            const eqn0 = tree_to_eqn(tree, true)  // doing it up here so that i have it before solve_for mutates it
    
            const tree_counts = trees_counts[tree_idx]
            const tree_variables = Object.keys(tree_counts)
            const sorted_variable_idxs = sort_idxs(Object.values(tree_counts))
    
            for (variable_idx of sorted_variable_idxs){

                const solve_var = tree_variables[variable_idx]

                if (!(vars_to_remove.includes(solve_var))){continue}

                if (tree.op !== "+" && tree.op !== undefined){
                    throw "need to implement other top operations"
                }

                let sol_tree
                let old_tree

                const expression = tree_to_expression(tree, true) // this is only needed for numeric solve, BUT combinesolveterms mutates tree
                try {
                    old_tree = JSON.parse(JSON.stringify(tree))
                    sol_tree = solve_for(old_tree, solve_var)
                     
                }catch (e){
 

                    const has_single_var = Object.keys(trees_counts[tree_idx]).length === 1
                    if (e instanceof CantSymbolicSolve && has_single_var){

                        if (has_infinite_solutions(expression)){
                            delete_tree(tree_idx)
                            break
                        }

                        sol_tree = numeric_solve(expression)
                    }else if (e instanceof CantSymbolicSolve){
                        continue
                    }else if(e instanceof VariableEliminatedError){
                        const reduced_tree = e.remaining_tree
                        update_tree(reduced_tree, tree_idx)
                        break
                    }else{
                        throw e
                    }
                }
                delete_tree(tree_idx)
                return {eqn0: eqn0, solve_var: solve_var, sol: sol_tree}
            }
        }

        const remaining_vars = trees_counts.map(counts => {return Object.keys(counts)}).flat()

        if (empty_intersection(remaining_vars,vars_to_remove)){
            return null//throw new AlreadyDone
        }

        // throw new CantSolveError
        return null
    }
    
    function trim_trees(){
    
        tree_idxs.forEach(tree_idx => {

            const tree = trees[tree_idx]
            if (tree === null){return}
    
            const tree_vars = Object.keys(trees_counts[tree_idx])

            const n_vars = tree_vars.length
            const zero_sol = is_near_zero(tree) 
            const nonzero_sol = n_vars === 0 && !zero_sol 

            if (nonzero_sol){
                throw new ContradictionError
            }


        })
    }
    
    function delete_tree(tree_idx){
        trees[tree_idx] = null
        trees_counts[tree_idx] = {}
        trees_complexity[tree_idx] = null // not actually needed but whatever
    }
    
    function update_tree(simplified_tree, tree_idx){
        

        const stuff = get_tree_info(simplified_tree)
        const complexity = stuff[0]
        const counts = stuff[1]
        //[complexity, counts] = get_tree_info(simplified_tree)
    
        trees[tree_idx] = simplified_tree
        trees_complexity[tree_idx] = complexity
        trees_counts[tree_idx] = counts
    }
 
    function get_tree_info(tree){
    
        // for now, ill just use the number of operations
     
        let complexity = 0

        const counts = {}
    
        increment_complexity_count(tree)
 
        
        if (tree.op !== "+" && tree.op !== undefined){
            complexity = Infinity
        }



        return [complexity, counts]
    
        function increment_complexity_count(tree){
    
            if (!(typeof tree === "string")){
                complexity += 1
                tree.terms.forEach(increment_complexity_count)
                return
            }
    
            const is_variable = /[a-zA-Z]/.test(tree)
    
            if (is_variable){
                if (Object.keys(counts).includes(tree)){
                    counts[tree] += 1
                }else{
                    counts[tree] = 1
                }
            }
        }
    }
}


function fuck_my_life_push_to_equation_visuals_but_check_first(eqns){
    
    eqns.forEach(eqn => {
                
        if (!eqn.includes("VISUAL")){
            return
        }
        if(get_all_vars(eqn).length !== 0){return}

        const vis_exps = eqn.split("|").slice(0,-1)

        vis_exps.forEach(vis_exp => {
            
            // just to hit an error if it's nan or infinity
            eqn_to_tree(ltx_to_math(vis_exp))


        })

        equation_visuals.push(eqn)
        
    })

}


function sort_idxs(sorted_array) {
    const indices = sorted_array.map((_, index) => index);
    indices.sort((a, b) => sorted_array[a] - sorted_array[b]);
    return indices
}

function empty_intersection(arr1, arr2){
    const any_intersection = arr1.some(el1 => {
        return arr2.includes(el1)
    })

    return !any_intersection
}

function get_intersection(arr1,arr2){
    const intersection = arr1.filter(el1 => {
        return arr2.includes(el1)
    })

    return intersection

}

function has_infinite_solutions(exp_ltx){
    
    const exp = ltx_to_math(exp_ltx)

    // copy pasted from numeric solve
    const exp_vars = get_all_vars(exp_ltx)
    if (exp_vars.length!==1){throw "can only have one variable, has multiple: "+exp_vars}
    const solve_var = exp_vars[0]
    
    // copy and pasted from newton raphson, it's fine...
    var f = (x)=>{
        return math.evaluate(
            sub_all_vars(exp,solve_var,x.toString())
        )
    }

    const random_guesses = [3.23,230.2390,12321.239,9023.23432] // just random stuff, idc, if they're all zero, no way it's a coincedence

    for (guess of random_guesses){

        // check
        const value = f(guess)

        if (!is_near_zero(value)){
            
            return false 
        }
    }

    console.log("numeric solve infinite solutions found")

    return true

}


const past_numeric_solutions = {}

function numeric_solve(exp_ltx){

    //exp = exp_ltx
    exp = ltx_to_math(exp_ltx)
    var exp_vars = get_all_vars(exp_ltx)
    if (exp_vars.length!==1){throw "can only have one variable, has multiple: "+exp_vars}
    var solve_var = exp_vars[0]
    
    const n_guesses = 20

    const base = 1.5
    const ascending = Array.from(Array(n_guesses/2), (_, index) => index + 1);
    const guesses = ascending.map(val=>{return [base**val,base**(-val),-(base**val),-(base**(-val))]}).flat()

    
    const past_solution = past_numeric_solutions[solve_var]

    if(past_solution && last_spinner_pressed){
        // this helps a lot for speeding up circular mirror but doesn't really affect other things
        // (basically uses the previous guess as the first guess)
        // only for while the spinner is held down, that way it doesnt go for a really weird solution
        
        guesses.unshift(past_solution)
    }
    

    let count = 0
    for (let guess of guesses){
        count ++ 
        try{
            const solution = newton_raphson(exp,solve_var,guess)
            past_numeric_solutions[solve_var] = Number(solution)
            // console.log(solut)
            return solution        
        }catch (e){
            if (e instanceof NumericSolveError || e instanceof EvaluateError){
                continue
            }else{
                throw e
            }
        }
    }


    throw new NumericSolveError("Can't find numeric solution")

}





function to_desmos(expression){
    const var0 = get_all_vars(expression)[0]
    console.log(sub_all_vars(expression,var0,"x"))
}



function is_real(value){

    var im_comp = math.im(value)

    return im_comp === 0
    
}




function numeric_solve_with_bisection(exp_ltx){

    /*
    uses bisection instead so things don't shoot off to infinity
    but has its own issus, can't really remember
    */

    const exp = ltx_to_math(exp_ltx)
    var exp_vars = get_all_vars(exp_ltx)
    if (exp_vars.length!==1){throw "can only have one variable, has multiple: "+exp_vars}


    const solve_var = exp_vars[0]
    const f = (value)=>{return evaluate(exp,solve_var,value)}

    const max_val = 1000

    const n_guesses = 10**4

    const ascending = Array.from(Array(n_guesses), (_, index) => index + 1);
    const descending = ascending.map(val => {return -val})

    const int_vals = [ascending,descending].flat()
    const guesses = int_vals.map(val => {return sign(val)*val**2 * max_val/n_guesses**2})

    let bound1 = null
    let root = null

    let prev_y, y

    for (value of guesses){
        
        const y_new = f(value)

        if (!is_real(y_new)){
            bound1 = null
            continue
        }

        prev_y = y
    
        y = y_new


        if (bound1 === null || y*prev_y >= 0){
            bound1 = value
            continue

        }

        let low_bound, high_bound

        if (value>0){
            low_bound = bound1
            high_bound = value
        }else{
            low_bound = value
            high_bound = bound1
        }

        root = bisection(exp,low_bound,high_bound,solve_var)

        if (root === null){
            bound1 = value
            continue
        }else{
            break
        }
        
    }

    if (root === null){
        throw "nothing found"
    }

    return num_to_string(root)
  

}

function bisection(exp,low_bound, high_bound, solve_var = "x"){

    const f = (value)=>{return evaluate(exp,solve_var,value)}

    tol = 10**-9

    const max_count = 100

    let count = 0
    
    let x_low = low_bound

    let x_high = high_bound

    let x_mid

    while (x_high-x_low>tol){
        
        x_mid = (x_high+x_low)/2

        //! could be more efficient by not computing x_low when it's not updated
        if (f(x_mid)*f(x_low)>0){
            // mid and low are same signs
            // means it's between mid and right
            x_low = x_mid
        }else{
            x_high = x_mid
        }

        if (count > max_count){
            return null
        }

        count +=1

    }

    return x_mid




}



function evaluate(expression,solve_var,value){
    return math.evaluate(
        sub_all_vars(expression,solve_var,String(value))
    )
}







function newton_raphson(exp,solve_var,guess){


    const exp_degree = rad_to_deg(exp)

    var prev_guess
    

    var tol = 10**(-9)
    const max_count = 100

    var f = (x)=>{
        //RAD need to first replace with degrees so it doesn't have to run that every time
        // exp_deg = rad_to_deg(exp)
        return math.evaluate(
            sub_all_vars(exp_degree,solve_var,x.toString())
        )
    }

    function fprime(x) {
        var h = 0.001;
        return math.divide(math.subtract(f(math.add(x,h)),f(math.subtract(x,h))),2*h)
    }

    var iter_count = 0
    while (prev_guess===undefined || math.abs(math.subtract(guess,prev_guess))>tol){

        if (iter_count == 0 && f(guess) == 0){
            // is_supicious(exp)
        }

        var new_guess = math.subtract(guess,math.divide(f(guess),fprime(guess)))
        var prev_guess = guess
        var guess = new_guess
        iter_count+=1

        if (iter_count>max_count){// || isNaN(guess)){ if you check if it's nan it will return an error when in complex domain even when it would've have converged on the real solution
            throw new NumericSolveError("Cannot find solution, possibly no real solutions")
        }
    }

    var real_comp =  math.re(guess)
    var im_comp = math.im(guess)

    if (Math.abs(im_comp)>1e-10){throw new NumericSolveError("No real solutions")}
    
    if (real_comp === Infinity || real_comp === -Infinity){throw new NumericSolveError("Solution is infinite")}

    console.log(`iterations: ${iter_count}`)
    return num_to_string(real_comp)

    
}

function forward_solve(ordered_sub){

    ordered_sub.reverse()

    const steps = []

    for (let sub_i=0;sub_i<ordered_sub.length;sub_i++){
        
        var sub = ordered_sub[sub_i]
        
        var val = sub.sol


        const solution_step = {}

        // just being done to convert it to latex
        const tree = eqn_to_tree(sub.sol, do_simplification = false)
        const ltx_expression = tree_to_expression(tree,true)

        solution_step.eqn = `${sub.solve_var}=${ltx_expression}`

        const val_degree = rad_to_deg(val)

        try{

            sub.sol = num_to_string(math.evaluate(val_degree))    // this is necessary for trig functions
        }catch(e){
            throw new TooMuchUnknownError
        }



        solution_step.sol = `${sub.solve_var}=${sub.sol}`



        for (let replace_i=sub_i+1; replace_i<ordered_sub.length; replace_i++){
            var next_sub = ordered_sub[replace_i]



            next_sub.sol = sub_all_vars(next_sub.sol, sub.solve_var, val)





        }

        if (sub_i!==0){ // just cause the first sub isn't anything
            steps.push(solution_step)
            GLOBAL_solve_stuff.steps.forward.push(solution_step)
        }

        
    }

    return {solution:ordered_sub,steps:steps}
}


function get_all_vars(eqns){




    // TODO ideally i wouldnt be using this and JUST using the tree functions, but it's fine for now
    // TODO most of this isn't necessary now that i put placeholders for backslashes and underscores, but keeping for now
    //GREEK don't have this, will replace backslash for greek
    const greek_letters = [
        'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota',
        'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau',
        'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega', 'alpha', 'beta', 'gamma', 'delta',
        'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi',
        'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'
	]//.filter(letter => {return letter !== "pi"})

    if (typeof eqns ==="string"){eqns = [eqns]}


    const quote_dummy = "__QUOTE_FOR_COLOR__"


    eqns = eqns.map(eqn => {return eqn.replaceAll('"',quote_dummy)})



    var regex = /\W[a-zA-Z](\w?)+/g
    var vars = []
    eqns.forEach((eqn)=>{
        txt = "-"+eqn+"-"
        var matches = [...txt.matchAll(regex)]
        var eqn_vars = []
        matches.forEach(match=>{
            var var_txt = match[0]


            if (var_txt[0] !== "\\"){
                var_txt = var_txt.substring(1)
            }
            
            const is_special = var_txt.startsWith("\\")
            const is_greek = greek_letters.some(letter => {return var_txt.startsWith("\\"+letter)})
            if (!is_special || is_greek){
                eqn_vars.push(var_txt)
            }
        })
        vars.push(eqn_vars)
    })

    let all_vars = [...new Set(vars.flat())]

    all_vars = all_vars.filter(test_var=>{return !test_var.includes("VISUAL")})

    // just in case it's not in latex
    all_vars = all_vars.filter(test_var => {return !trig_funcs.includes(test_var)})
    
    // filter out the colors
    all_vars = all_vars.filter(test_var => {
        const in_quotes = test_var.includes(quote_dummy)
        return !in_quotes
    })

    return all_vars
}



function sub_all_vars(expression,sub_in,sub_out){

    // honestly just going full caveman mode now (it's cause splitbyops needs a space after cdot                        I)
    expression = expression.replaceAll("\\"," \\").replaceAll("  "," ")
    
    if (typeof sub_in === "string"){
        sub_in = [sub_in]
    }

    if (typeof sub_out === "string"){
        sub_out = [sub_out]
    }


    sub_out = sub_out.map(sub => {return "("+sub+")"})

    const terms = split_by_ops(expression)


    

    const new_terms = terms.map((term,idx)=>{
        
        const sub_idx = sub_in.indexOf(term)

        if (sub_idx === -1){
            return term
        }else{
            return sub_out[sub_idx]
        }
    })


    const subbed_expression = new_terms.join("")
    return subbed_expression
    // return remove_unneeded_parentheses(subbed_expression)

}

function remove_unneeded_parentheses(eqn){
    return eqn
}
function OLD_remove_unneeded_parentheses(eqn){


    /*
    
    \sin(a) --> \sina

    removes parentheses surroundings single variables, for outputting substitution results

    limitation: only removes parentheses surrounding a single variable

    so....

    a=(b+c) --> parentheses won't be removed
    a=((b)) --> a = (b)
    it's fineeeeeeeeeeeee, easier to see what was subbed any way
    */


    function is_in_symbol(char){
        const alpha_num_regex = /[a-zA-Z0-9]/

        return alpha_num_regex.test(char) || char === "_" || char === "."
 
    }

    const chars = eqn.split("")

    let start_idx
    let in_unneeded_parentheses = false

    const unneeded_char_idxs = []


    for (let i=0; i<chars.length; i++){
        const char = chars[i]

        if (char === "("){
            start_idx = i
            in_unneeded_parentheses = true
        }else if (char === ")" && in_unneeded_parentheses){
            unneeded_char_idxs.push(start_idx)
            unneeded_char_idxs.push(i)
            in_unneeded_parentheses = false
        }else if (!is_in_symbol(char)){
            in_unneeded_parentheses = false
        }
    }

    for (idx of unneeded_char_idxs){
        chars[idx] = ""
    }


    eqn = chars.join("")


    return eqn
}




class ContradictionError extends Error {
    constructor (){
        super("contradiction in the system")
    }
}

class CantSolveError extends Error {
    constructor (){
        super("cannot solve the system")
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


function make_MQ(){

    const out_fields = [...$(".eqn-field")]

    out_fields.forEach(field=>{

        // if the mq field is hidden when it's mqilified, parentheses don't show up
        // so i have all its parents displayed as blocks, store the original display, and revert it back after
        
        const outer_fields = [...$(field).parents()]

        const outer_style = []
        outer_fields.forEach(field=>{
            outer_style.push(field.style.display)
            field.style.display = "block"
        })

        MQ.StaticMath(field)

        outer_fields.forEach((field,idx)=>{
            field.style.display = outer_style[idx]
        })
    })
}

function remove_vars(SoEs, vars_to_remove){

    if (vars_to_remove.length === 0){
        
        const simplified_SoEs = SoEs.map(eqn => {
            const tree = eqn_to_tree(ltx_to_math(eqn))
            const simplified_tree = simplify_tree(tree)
            return tree_to_eqn(simplified_tree, true)
        })
        return simplified_SoEs
    }

    const back_solution = back_solve(SoEs, vars_to_remove, false)
    const remaining_trees = back_solution.remaining_trees
    const steps = back_solution.steps
    
    const final_eqns = remaining_trees.map(tree => {return tree_to_eqn(tree, true)})
    


    return final_eqns
}

function solve_eqns(SoEs){

    const vis_eqns     = SoEs.filter(eqn=>{return eqn.includes("VISUAL")})
    const non_vis_eqns = SoEs.filter(eqn=>{return !eqn.includes("VISUAL")})

    const vars_to_remove = get_all_vars(non_vis_eqns)

    const back_solution = back_solve(non_vis_eqns, vars_to_remove, true)
    const ordered_sub = back_solution.ordered_sub
    const steps = back_solution.steps

    // TODO need to add steps for forward solve
    const solutions = forward_solve(ordered_sub)
        
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

    display_vis(solved_vis_eqns)
    return result
}

function back_solve(SoEs, vars_to_remove, to_solve_system){

    if (SoEs.some(SoE => {SoE.includes("VISUAL")})){
        throw "solver not yet implemented for visuals"     // TODO filter out visual equations
    }

    const trees = SoEs.map(ltx_to_math).map(eqn_to_tree) // trees will be mutated in the backsolve scope
    const trees_info = trees.map(get_tree_info)          
    const trees_complexity = trees_info.map(info => {return info[0]})
    const trees_counts = trees_info.map(info => {return info[1]})
    const tree_idxs = trees.map((_, idx) => {return idx})   // this shouldnt be mutated, only read (just for convenience)
    
    const numeric_trees = []    // only relevant if to_solve_system is true // TODO change this name
    const ordered_sub = []  // again only relevant for solving the system
    
    const solution_steps = []
    
    const use_ltx = true 
    
    while (true){  
    
        let solution
        try{
            solution = find_solution()
        }catch(e){
            if (e instanceof AlreadyDone){
                console.log('done earl')
                break
            }else{
                throw e
            }
        }
        

        const solution_step = {
            eqn0: solution.eqn0,
            sol: tree_to_expression(solution.sol, use_ltx),
            solve_var: solution.solve_var
        }

        
        const tree_idxs_with_sol_var = tree_idxs.filter(idx => {
            return Object.keys(trees_counts[idx]).includes(solution.solve_var) && trees[idx] !== null
        })
    

        // this is only relevant for solving system (not removing variables)
        // not necessary but it's fine
        // TODO might need to include product branches for forward solving
        ordered_sub.push({solve_var: solution.solve_var, sol: tree_to_expression(solution.sol)})

        const substitution_steps = []
        tree_idxs_with_sol_var.forEach(idx => {
            const tree = trees[idx]
            const eqn0 = tree_to_eqn(tree, use_ltx)
            const subbed_tree = sub_in(tree, solution.solve_var, solution.sol)
            const eqn_subbed = tree_to_eqn(subbed_tree, use_ltx)
            substitution_steps.push({eqn0: eqn0, eqn_subbed: eqn_subbed})
            update_tree(subbed_tree, idx)
        })

        solution_step.substitutions = substitution_steps    // other assignments done earlier since subin mutates tree
    
        show_step(solution_step)

        trim_trees()
        
        const all_tree_vars = trees_counts.map(count => {return Object.keys(count)}).flat()
    
        if (empty_intersection(all_tree_vars, vars_to_remove)){
            break
        }
    }
    
    if (!to_solve_system && numeric_trees.length !== 0){
        throw "this shouldnt happen, should only add to to_solve_system if solving system"
    }
    
    const remaining_trees = trees.filter(tree => {return tree !== null})
    if (to_solve_system &&  remaining_trees.length !== 0){
        throw "also shouldn't happend, shouldn't have exited loop, if there were trees remaining since ALL variables are to be removed"
    }
    
    return {remaining_trees: remaining_trees, ordered_sub: ordered_sub, steps: solution_steps}
    
    function find_solution(){
    
        const sorted_trees_idxs = sort_idxs(trees_complexity)

        for (const tree_idx of sorted_trees_idxs){
    
            const tree = trees[tree_idx]             
            if (tree === null){continue}

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
                        sol_tree = numeric_solve(expression).sol
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
            throw new AlreadyDone
        }

        throw new CantSolveError
    }
    
    function trim_trees(){
    
        tree_idxs.forEach(tree_idx => {

            const tree = trees[tree_idx]
            if (tree === null){return}

            const other_trees_vars = trees_counts.map((counts, idx) => {
                if (idx === tree_idx){return []}
                return Object.keys(counts)
            }).flat()
    
            const tree_vars = Object.keys(trees_counts[tree_idx])

            const n_vars = tree_vars.length
            const zero_sol = is_near_zero(tree) 
            const nonzero_sol = n_vars === 0 && !zero_sol 

            if (nonzero_sol){
                throw new ContradictionError
            }
    
            const is_isolated = empty_intersection(other_trees_vars, tree_vars)
            const has_vars_to_remove = !empty_intersection(vars_to_remove, tree_vars)
            const is_unneded = is_isolated && has_vars_to_remove && !to_solve_system
        
            if (is_unneded || zero_sol){
                delete_tree(tree_idx)
            }
        })
    }
    
    function delete_tree(tree_idx){
        trees[tree_idx] = null
        trees_counts[tree_idx] = {}
        trees_complexity[tree_idx] = Infinity // not actually needed but whatever
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
    

        // TODO need to make it so non additions are pushed to the very end, and are then handled recursively
        // non multiplication operations don't have to be done recursively though -- should just be stripped immediately
            // so where would this be done?
        if (tree.op !== "+" && tree.op !== undefined){
            throw "for now can only have plus for top operation"
            //return [Infinity, {}]
        }

        let complexity = 0
        const counts = {}
    
        increment_complexity_count(tree)
    
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

function numeric_solve(exp_ltx){
    //exp = exp_ltx
    exp = ltx_to_math(exp_ltx)
    var exp_vars = get_all_vars(exp_ltx)
    if (exp_vars.length!==1){throw "can only have one variable, has multiple: "+exp_vars}
    var solve_var = exp_vars[0]
    
    var prev_guess
    var guess = 1

    var tol = 0.00001
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
        iter_count+=1

        if (iter_count>max_count){// || isNaN(guess)){ if you check if it's nan it will return an error when in complex domain even when it would've have converged on the real solution
            throw new NumericSolveError("Cannot find solution, possibly no real solutions")
        }
    }

    var real_comp =  math.re(guess)
    var im_comp = math.im(guess)

    if (im_comp>1e-10){throw new NumericSolveError("No real solutions")}
    

    return {solve_var: solve_var, sol: num_to_string(real_comp)}    // TODO doesn't need to output the solveVar

}

function forward_solve(ordered_sub){

    ordered_sub.reverse()

    for (let sub_i=0;sub_i<ordered_sub.length;sub_i++){
        
        var sub = ordered_sub[sub_i]
        
        var val = sub.sol
        
        if (get_all_vars(val).length!==0){throw new TooMuchUnknownError}


        sub.sol = num_to_string(math.evaluate(val))    // this is necessary for trig functions
        

        
        
        for (let replace_i=sub_i+1; replace_i<ordered_sub.length; replace_i++){
            var next_sub = ordered_sub[replace_i]
            next_sub.sol = sub_all_vars(next_sub.sol, sub.solve_var, val)
        }
    }
    return ordered_sub
}


function get_all_vars(eqns){


    // TODO ideally i wouldnt be using this and JUST using the tree functions, but it's fine for now

    
    const greek_letters = [
        'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota',
        'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau',
        'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega', 'alpha', 'beta', 'gamma', 'delta',
        'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi',
        'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'
	]//.filter(letter => {return letter !== "pi"})

    if (typeof eqns ==="string"){eqns = [eqns]}
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


    return new_terms.join("")

}




// TODO work on showing steps

function show_step(step){

    const solve_texts = []
    const sub_texts = []
    
    function sp(n){
        let txt = ""
        for (let i=0;i<n;i++){
            txt = txt+"\\ "
        }
        return txt
    }
    
    const arrow = " \\ \\  \\Rightarrow \\ \\ "
    
    const line = `\\text{Solving} ${sp(2)} ${step.eqn0} ${sp(2)}\\text{for} ${sp(2)} ${step.solve_var} ${arrow} ${step.solve_var} = ${step.sol}`

    solve_texts.push(line)

    const sub_lines = step.substitutions.map(sub => {
        return `\\text{Subbing} ${sp(2)} ${sub.eqn0} ${arrow} ${sub.eqn_subbed}`
    })

    const sub_text = sub_lines.join("\n")

    sub_texts.push(sub_text)

    
    // TODO need to use the UI tree list function, but need to somehow add classes to mathquillify it
    //const dom_solve_steps = createToggleContainer(solve_texts, sub_texts)
    //$("#solve-steps")[0].appendChild(dom_solve_steps)

    
}

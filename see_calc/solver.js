
class ContradictionError extends Error {
    constructor (message){
        super("contradiction in the system")
    }
}


class CantSolveError extends Error {
    constructor (message){
        super("cannot solve the system")
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







//solve_eqns(["c=d","a=3","b=a+2"])

//const boop = solve_eqns(["a+b+c=3","a=2*c","c+b*a=7"])


function show_steps(steps){


    const solve_texts = []
    const sub_texts = []
    
    
    function sp(n){
    
    
        let txt = ""
        for (let i=0;i<n;i++){
            txt = txt+"\\ "
        }
        return txt
    }
    
    
    
    const space = "\\ "
    const arrow = " \\ \\  \\Rightarrow \\ \\ "
    
    steps.forEach(step => {
    
    
        const line = `\\text{Solving} ${sp(2)} ${step.eqn0} ${sp(2)}\\text{for} ${sp(2)} ${step.solve_var} ${arrow} ${step.solve_var} = ${step.sol}`
    
        solve_texts.push(line)
    
        const sub_lines = step.substitutions.map(sub => {
            return `\\text{Subbing} ${sp(2)} ${sub.eqn0} ${arrow} ${sub.eqn_subbed}`
        })
    
        const sub_text = sub_lines.join("\n")
    
        sub_texts.push(sub_text)
    
        // TODO get remaining equations
    })
    
    const dom_solve_steps = createToggleContainer(solve_texts, sub_texts)
    //document.body.appendChild(dom_solve_steps)
    
}

//! this of course should be deleted when included in site (redundant)
var MQ = MathQuill.getInterface(2);

make_MQ()


//! copying this function over to see_calc.js, TODO obviously fix this 
function createToggleContainer(texts, sub_texts) {
    // Create the main container element
    const container = document.createElement('div');
  
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
  
      // Create the arrow button
      const arrowButton = document.createElement('button');
      arrowButton.innerText = '▶';
  
      // Add CSS class to the button
      arrowButton.classList.add('arrow-button');
  
      // Create the text element
      const textElement = document.createElement('span');
      textElement.innerText = text;
    textElement.classList.add("eqn-field")
    textElement.classList.add("text-element")

    const boop = document.createElement("div")

    boop.appendChild(arrowButton)
    boop.appendChild(textElement)
        

      // Create the toggle div
      const toggleDiv = document.createElement('div');
      toggleDiv.style.display = 'block';    //! just temporary so i dont have to click each time
      toggleDiv.innerText = sub_texts[i];
      toggleDiv.classList.add('toggle-div'); // Add a CSS class for the toggle div
      toggleDiv.classList.add("eqn-field")
        toggleDiv.classList.add("sub-text-element")

  
      // Append the arrow button and text element to the container
      container.appendChild(boop);
  
      // Function to toggle the visibility of the toggle div
      function toggleDivVisibility() {
        if (toggleDiv.style.display === 'none') {
          toggleDiv.style.display = 'block';
          arrowButton.innerText = '▼';
        } else {
          toggleDiv.style.display = 'none';
          arrowButton.innerText = '▶';
        }
      }
  
      // Add event listener to the arrow button to toggle the div visibility
      arrowButton.addEventListener('click', toggleDivVisibility);
  
      // Append the toggle div to the container
      container.appendChild(toggleDiv);
    }
  
    return container;
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


    const back_solution = back_solve(SoEs, vars_to_remove, false)
    const remaining_trees = back_solution.remaining_trees
    const steps = back_solution.steps
    
    const final_eqns = remaining_trees.map(tree => {return tree_to_eqn(tree, true)})
    


    show_steps(steps)
    
    return final_eqns
}

function solve_eqns(SoEs){


    

    let vis_eqns     = SoEs.filter(eqn=>{return eqn.includes("VISUAL")})
    const non_vis_eqns = SoEs.filter(eqn=>{return !eqn.includes("VISUAL")})

    const vars_to_remove = get_all_vars(non_vis_eqns)

    const back_solution = back_solve(non_vis_eqns, vars_to_remove, true)
    const ordered_sub = back_solution.ordered_sub
    const steps = back_solution.steps

    // TODO need to add steps for forward solve
    const solutions = forward_solve(ordered_sub)//.concat(numeric_solutions))
        
    const solve_vars = solutions.map(sol => {return sol.solve_var})
    const solve_exps = solutions.map(sol => {return sol.sol})

    
    const all_solved = vars_to_remove.every(remove_var => {return solve_vars.includes(remove_var)})
    if (!all_solved){
        console.warn("THIS SHOULD ONLY HAPPEN DUE TO 0 PRODUCT TERMS")
        throw new TooMuchUnknownError
    }

    var result = []
    var display = []
    solutions.forEach(sol=>{
        var frac = sol.sol
        // TODO i dont think splitting the fraction is needed now
        var frac_comps = frac.split("/")
        if (frac_comps.length===1){var val = frac_comps[0]}
        else{var val = frac_comps[0]/frac_comps[1]}
        const n_dec_place = 5
        const rounded_value = Math.round(val*10**n_dec_place)/(10**n_dec_place)

        result.push(sol.solve_var+"="+val)
        //display.push(math_to_ltx(sol.solve_var)+"="+rounded_value)
    })

    vis_eqns = vis_eqns.map(eqn=>{
        solve_vars.forEach((_,i)=>{
            eqn = sub_all_vars(eqn,solve_vars[i],solve_exps[i])
        })
        return eqn
    })

    display_vis(vis_eqns)

    show_steps(steps)

    return result
    
}

function back_solve(SoEs, vars_to_remove, to_solve_system){

    // TODO filter out visual equations
    const non_ltx_SoEs = SoEs.map(ltx_to_math)
    const trees = non_ltx_SoEs.map(eqn_to_tree) // right now im assuming trees is in global scope
    const trees_info = trees.map(get_tree_info)  // also assuming global
    const trees_complexity = trees_info.map(info => {return info[0]})
    const trees_counts = trees_info.map(info => {return info[1]})
    const tree_idxs = trees.map((_, idx) => {return idx})   // this shouldnt be mutated, only read
    
    const numeric_trees = []    // only relevant if to_solve_system is true
    const ordered_sub = []  // again only relevant for solving the system
    
    const solution_steps = []
    
    const use_ltx = true 
    
    while (true){  
    
        const solution = find_solution()

        // TODO also include product branches when showing steps?
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
            const subbed_tree = sub_in(tree, solution.solve_var, solution.sol, solution.product_branches)

            const eqn_subbed = tree_to_eqn(subbed_tree, use_ltx)
            substitution_steps.push({eqn0: eqn0, eqn_subbed: eqn_subbed})
            update_tree(subbed_tree, idx)
        })

        solution_step.substitutions = substitution_steps
        solution_steps.push(solution_step)
    
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
            if (tree === null){
                continue
            }

            const eqn0 = tree_to_eqn(tree, true)  // doing it up here so that i have it before solve_for mutates it
    
            const tree_counts = trees_counts[tree_idx]
            const tree_variables = Object.keys(tree_counts)
            
            
            const sorted_variable_idxs = sort_idxs(Object.values(tree_counts))
    
            try {
                for (variable_idx of sorted_variable_idxs){
    
                    const solve_var = tree_variables[variable_idx]
    
                    if (!(vars_to_remove.includes(solve_var))){
                        continue
                    }
    


                    

                    let sol_tree, product_branches
                    try {
                        [sol_tree, product_branches] = solve_for(tree, solve_var)     
                    }catch (e){
                        // TODO this looks disgusting
                        // but... it kind of makes natural sense, try regular solving, if it doesn't work and there's only one variable, then you can do to_solve_system solving
                        if (e instanceof CantMergeError){
                            const has_single_var = Object.keys(trees_counts[tree_idx]).length === 1
                            if (has_single_var){
                                const expression = tree_to_expression(tree)

                                // a to_solve_system error solve should rise to the user (no real solutions), should NOT continue solving
                                sol_tree = numeric_solve(expression).sol
                                product_branches = []
                            }else{
                                continue
                            }
                            
                        }else{
                            throw e
                        }
                    }
                    delete_tree(tree_idx)
                    return {eqn0: eqn0, solve_var: solve_var, sol: sol_tree, product_branches: product_branches}

                }
            }catch (e){
                if (e instanceof VariableEliminatedError){
                    const reduced_tree = e.remaining_tree
                    update_tree(reduced_tree, tree_idx)
                    continue
                }else{
                    throw e
                }
            }
        }
        throw new CantSolveError
    }
    

    function trim_trees(){
    
        tree_idxs.forEach(tree_idx => {
    

            const tree = trees[tree_idx]
    
            if (tree === null){
                return
            }

            const other_trees_vars = trees_counts.map((counts, idx) => {
                if (idx === tree_idx){return []}
                return Object.keys(counts)
            }).flat()
    
 
    
    
            const tree_vars = Object.keys(trees_counts[tree_idx])

            
            const n_vars = tree_vars.length
            const zero_sol = Number(tree) === 0
            const nonzero_sol = n_vars === 0 && !zero_sol
            const single_var_sol = n_vars === 1 && to_solve_system
        
    
    
    
            const is_isolated = empty_intersection(other_trees_vars, tree_vars)
    
            const has_vars_to_remove = !empty_intersection(vars_to_remove, tree_vars)
    
    
            // should work but makes things too complicated
            // const has_vars_removed = is_isolated && no_vars_to_remove
    
    
            const is_unneded = is_isolated && has_vars_to_remove && !to_solve_system
    
    
            if (nonzero_sol){
                throw new ContradictionError
            }
        
            /*
            if (single_var_sol){
                numeric_trees.push(tree)
            }
        */
            /*
            if (has_vars_removed){
                vars_removed_trees.push(tree)
            }
            */
            
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
        

        

        [complexity, counts] = get_tree_info(simplified_tree)
    
        trees[tree_idx] = simplified_tree
        trees_complexity[tree_idx] = complexity
        trees_counts[tree_idx] = counts
    
    }
 
    function get_tree_info(tree){
    
        // for now, ill just use the number of operations
    

        if (tree.op === "*"){
            // TODO also handle exponent trig etc

            return [Infinity, {}]
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

        if (iter_count>max_count || isNaN(guess)){
            throw new NumericSolveError("Cannot find solution, possibly no real solutions")
        }
    }

    var real_comp =  math.re(guess)
    var im_comp = math.im(guess)

    if (im_comp>1e-10){throw new NumericSolveError("No real solutions")}
    
    return {solve_var: solve_var, sol: real_comp.toString()}

    

}

function forward_solve(ordered_sub){


    /*

    ordered_sub is returned in back_solve has the sub order
    the last one created in solve_eqns with the final to_solve_system value

    */

    ordered_sub.reverse()

    for (let sub_i=0;sub_i<ordered_sub.length;sub_i++){
        
        var sub = ordered_sub[sub_i]
        
        var val = sub.sol
        
        if (get_all_vars(val).length!==0){throw new TooMuchUnknownError}

        sub.sol = math.evaluate(val).toString()    // this is necessary for trig functions
        
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
	].filter(letter => {return letter !== "pi"})

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



function sub_all_vars(exp,sub_in,sub_out){

    // TODO ideally i wouldnt be using this and JUST using the tree functions, but it's fine for now

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

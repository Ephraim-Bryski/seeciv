function check_plot_subs(table, eqns){

    const plot_vars = get_plot_variables(eqns)



    // get the plot vars for each eqn

    // get the indices of the visual vars that are plot vars

    const variables = table[0]
            
    const values = table[1]

    const plot_var_idxs = plot_vars.map(plot_var => {return variables.indexOf(plot_var)})

    const plot_values = plot_var_idxs.map(idx => {return values[idx]})

    if (plot_values.some(NEED_TO_WRITE_is_multi_var)){
        throw new FormatError("some amazing super clear error message")
    }
}


function get_plot_variables(eqns){
    return eqns.map(eqn => {
        const visual_parts = eqn.split("VISUAL")
        if (visual_parts.length === 1){return []}
        const visual_name = visual_parts[1]
        const visual = vis_blocks.filter(block => {return block.name === visual_name})[0]
        if (!visual.plot_independent){return []}
        return visual.plot_independent.concat(visual.plot_dependent)
    }).flat()
}




function modify_plotting_input(block, input_before){


	if (!block.plot_independent){
		return
	}

	if (block.plot_independent.length > 1){
		throw "havent done dis yet"
	}
	
	const independent_parameter = block.plot_independent[0]
	const dependent_parameter = block.plot_dependent


	const independent_expression = input_before[independent_parameter]
	const dependent_expression = input_before[dependent_parameter]
    
    const independent_variables = get_all_vars(independent_expression)
    const dependent_variables = get_all_vars(dependent_expression)

    // do a bunch of check, also check if they're the same

	if (dependent_variables.length === 0){
		force_add_solve_error_for_plot("some great error message")
	}

	if (independent_variables.length === 0){
		force_add_solve_error_for_plot('lsdkj')
		// not sure if i should allow it
	}


	// throwing wont work anymore
	// so two possible solutions
		// i somehow have to do this in solveeqns
		// ORRRR
		// i just modify the solve block directly <-- honestly really like that one
    if (dependent_variables.length > 1 || independent_variables.length > 1){
        force_add_solve_error_for_plot('bop')
    }

	if (dependent_variables[0] !== independent_variables[0]){
		force_add_solve_error_for_plot('boop')
	}

	const variable = dependent_variables[0]

	const dummy_var = "DUMMY"

	const indepndent_equation = independent_expression +"="+dummy_var

    const blop = tree_to_expression(solve_for(eqn_to_tree(indepndent_equation),variable))

    const new_expression = sub_all_vars(dependent_expression,variable,blop)

	input_before[independent_parameter] = dummy_var
	input_before[dependent_parameter] = new_expression
}



function force_add_solve_error_for_plot(message){
	const solve_error_field = $("#solve-error-msg")[0]

	if (solve_error_field.innerText === ""){
		solve_error_field.innerText = message
	}
}

class InvalidReference extends Error {
    constructor (message){
        super(message)
    }
}


class FormatError extends Error {
    constructor (message){
        super(message)
    }
}


const error_in_UI = true // set to false so I can catch UI errors on uncaught exception

var prev_SoEs   // this variable is global EVERYWHERE (even outside this script), so justta make sure not to use it elsewhere

function calc(SoEs,start_idx,end_idx){





    if (prev_SoEs===undefined && start_idx!==0){
        throw "THIS IS WEIRD, is this the first run???"
    }

    if (prev_SoEs===undefined){
        var SoEs_before = []
    }else{
        var SoEs_before = prev_SoEs.slice(0,start_idx)

        // add in the previous SoEs before the start so you can get the results
        first = prev_SoEs.slice(0,start_idx)
        second = SoEs.slice(start_idx-SoEs.length)
        SoEs = [first,second].flat()
    }

    var SoEs_edit = SoEs.slice(start_idx,end_idx)
    var SoEs_after = SoEs.slice(end_idx,SoEs.length+1)



    // change_idx is passed as the starting position of the loop

    // getting all block names to check if a variable is called the same thing as any block, and to give different type of error if reference to future block:
    var all_SoE_names = []
    SoEs.forEach((SoE)=>{all_SoE_names.push(SoE.name)})


    var known_SoEs=SoEs_before.map((SoE)=>{return SoE.name})


    function is_ui_error(error){
        const solve_error_types = [ContradictionError, EvaluateError, NumericSolveError, TooMuchUnknownError, InvalidReference, FormatError, CantSolveError]
        return solve_error_types.some((type) => {return error instanceof type}) && error_in_UI
    }
    


    for (var SoE_i=start_idx;SoE_i<end_idx;SoE_i++){
        var SoE_struct=SoEs[SoE_i];
        var name=SoE_struct.name;
        var SoE=SoE_struct.eqns;

        if (known_SoEs.includes(name)){
            SoE_struct.result = new FormatError('"'+name+'"'+' is already a system name')
        }else if(name.length===0){
            SoE_struct.result = new FormatError("Name of block cannot be blank")
        }else if(!(/^\w+$/.test(name))){
            SoE_struct.result = new FormatError("Name of block cannot only have letters and numbers")
        }else if(name.includes("_")){
            SoE_struct.result = new FormatError("Name of block cannot include underscores")
        }else{
            SoE_struct.result = ""
        }

        const inputs = []

        for (var line_i=0;line_i<SoE.length;line_i++){
        
            try{

                const input = SoE[line_i].input
                inputs.push(input)



                parse_eqn_input(SoE[line_i].input,SoE[line_i].sub_table,name)
                
            }catch(error){
                if (is_ui_error(error)){
                    // SoEs[SoE_i].eqns[line_i].sub_table=undefined
                    SoEs[SoE_i].eqns[line_i].result=error
                }else{
                    if (typeof error==="object"){console.log(error)}
                    throw error
                }
            }
        }
        known_SoEs.push(name)
    }

    const solve_name = GLOBAL_solve_stuff.reference
    const old_solve_table = GLOBAL_solve_stuff.table

    try{
        parse_eqn_input(solve_name, old_solve_table, null, true)
    }catch(error){
        if (is_ui_error(error)){
            GLOBAL_solve_stuff.result = [{error:error}]
        }else{
            throw error
        }
    }
    






    prev_SoEs = SoEs

    // vis_eqns are the eqns to visualize, will figure out the visual by the variable names
    return SoEs


    

    

    function parse_eqn_input(line,old_table, block_name, solve_line = false){

        function get_ref_eqns(ref){

            // gets the equations of a block, ref is the name of the block

            var ref_idx = known_SoEs.findIndex((element) => element === ref)

            if (block_name===ref){
                throw new InvalidReference("Cannot reference own block")
            }else if(ref_idx===-1){
                if(all_SoE_names.includes(ref)){
                    throw new InvalidReference("Cannot reference future block")
                }else if (solve_line){
                    throw new InvalidReference(`"${ref}" is not a block name`)
                }else{
                    throw new InvalidReference('"'+ref+'"'+' is not an equation or block name')
                }
            }
            
            function contains_error(object){
                if (typeof object === 'string'){
                    return false
                }
                for (key of Object.keys(object)){
                    const sub_object = object[key]
                    if (sub_object instanceof Error){
                        return true
                    }
                    if (contains_error(sub_object)){
                        return true
                    }
                }
                return false
            }


            if (ref_idx<start_idx){
                var ref_SoEs = prev_SoEs
            }else{
                var ref_SoEs = SoEs
            }
            var ref_SoE=ref_SoEs[ref_idx].eqns
            var eqns = []
            if (contains_error(ref_SoEs[ref_idx])){
                throw new InvalidReference(ref+" has an error")
            }
            if (ref_SoEs[ref_idx].result instanceof Error){
                throw "should have been caught"
                throw new InvalidReference(ref+" has an error")
            }
            ref_SoE.forEach(ref_line => {
                var ref_eqns = ref_line.result
                if (ref_eqns===undefined){
                    boop
                }
                if (ref_eqns instanceof Error){
                    throw "should have been caught"
                    throw new InvalidReference(ref+" has an error")
                }
    

    
                eqns.push(ref_eqns.flat())
            });
            return eqns.flat()
        }

        /*
        line = line.replaceAll("\\ ","").replaceAll(" ","")
        line = strip_text(line)
        */

        if (line === ""){
            if (solve_line){
                return
            }else{
                throw new FormatError("Line cannot be blank")
            }
            
            
        }

        line = line.replaceAll("\\ ","")

        var vis_vars = []
    
        var new_table = undefined // removes table unless there is a substitution (removes if obsolete)

        const visual_txt = "\\operatorname{visual}"

        const visual_line = line.startsWith(visual_txt)

        const has_visual_txt = line.includes(visual_txt)

        const has_multiple_visual_texts = line.indexOf(visual_txt) !== line.lastIndexOf(visual_txt)


        if (has_visual_txt && !visual_line){
            throw new FormatError("visual keyword must be at the start of the line")
        }

        if (has_multiple_visual_texts){
            throw new FormatError("visual keyword must only occur once")
        }


        line = line.replaceAll(visual_txt,"")

        const match_vis_blocks = vis_blocks.filter((vis_block)=>{return vis_block["name"]===line})
        
        if(!(/^\w+$/.test(line)) && line !== ""){    // checks if not alphanumeric (also allows underscores)

            if (solve_line){
                throw new FormatError("Must input a reference to a block name, not an expression or equation") 
            }

            var eqn_split = line.split("=")

            if (eqn_split.length===1){
                throw new FormatError("Expression not allowed, only equation or block reference")
            }else if (eqn_split.length>2){
                throw new FormatError("Only single equation allowed")
            }else if (eqn_split.some((exp)=>{return exp.length==0})){
                throw new FormatError("Terms on both side of equal sign required")
            }else{
                
                do_other_syntax_checks(line)


                if (line.includes("color")){
                    throw new FormatError("'color' cannot be in a variable in an equation")
                }

                var line_math = ltx_to_math(line) // before getallvars so it catches 3a=4 (issue with invalid variable, not no variables!)

                if (get_all_vars(line).length===0){
                    throw new FormatError("Equation must have variables")
                }

                const simplified_eqn = tree_to_eqn(eqn_to_tree(line_math), true)

                if (get_all_vars(simplified_eqn).length === 0){
                    // i dont think this is necessary, and it anyway doesnt catch stuff that actually matters
                        // e.g. misses a=a+1
                    // throw new FormatError(`Equation simplifies to something without variables: ${simplified_eqn}`)
                }

                var result = [simplified_eqn]
            }

        }else if(visual_line){

            // if i wanted to list all the visuals in the error message
            // const vis_blocks_text = vis_blocks.map(block => {return block.name}).join("<br> ")
            if (line === ""){
                throw new FormatError(`visual must be followed by the name of a primitive visual`)
            }

            if (match_vis_blocks.length === 0){
                throw new FormatError(`${line} is not a known visual`)
            }
            // primitive visual
            var result = []


            const vis_block = match_vis_blocks[0]

            const vis_vars = Object.keys(vis_block.vars).map(add_char_placeholders)

            const vis_eqn = vis_vars.map(vis_var=>{
                return vis_var+"|"
            }).join("")+"VISUAL"+line

            /*
            if (old_table === undefined){
                old_table = {data: [vis_vars,default_vals],output_solve_idxs:[]}
            }
            */

            var new_stuff = compute_sub_table([vis_eqn],old_table,false,vis_block.vars)

            var result = new_stuff[0]//.flat()
            var new_table = new_stuff[1]

        }else if(solve_line){


            var eqns = get_ref_eqns(line)



            const has_vars = get_all_vars(eqns).length > 0


            let subbed_systems, new_table, solve_steps
            if (has_vars){
                var new_stuff = compute_sub_table(eqns,old_table,true)
                subbed_systems = new_stuff[0]
                new_table = new_stuff[1]
                solve_steps = new_stuff[2]
            }else{
                subbed_systems = [eqns]
                new_table = undefined
                solve_steps = []
            }

            
            result = subbed_systems

            if (new_table !== undefined){
                GLOBAL_solve_stuff.solved_table = new_table
            }
            
            GLOBAL_solve_stuff.result = result
            
        }else{
            // nonvisual reference without solve, so substitute:
            var eqns = get_ref_eqns(line)
            
            const has_vars = get_all_vars(eqns).length > 0

            if (has_vars){
                var new_stuff = compute_sub_table(eqns,old_table)
                var eqns = new_stuff[0]
                var new_table = new_stuff[1]
            }else{
                var eqns = [eqns]
                var new_table = undefined
            }


            result = eqns
            
        }



        if (solve_line){

            GLOBAL_solve_stuff
            return
        }

        // at the very end, will round the numbers 
        SoEs[SoE_i].eqns[line_i].result=result

        // kind of hacky but whatever (just to prevent firebase being annoying)
        if (new_table !== undefined){
            SoEs[SoE_i].eqns[line_i].sub_table = new_table
        }
        
    }


}

function find_vis_name(eqn) {

    const expression = eqn.split("=")[0]

    return expression.split("VISUAL")[1]

}






function compute_sub_table(eqns, old_table, for_solving = false,default_vis_vals = undefined){
    // takes the new eqns and the current table, replaces the columns to match the variables in the new eqns, then performs substitutions


    let old_output_solve_idxs
    if(old_table===undefined){  // the table hasn't been created yet
        old_output_solve_idxs = []
        var old_vars = []
        var n_col = 2
    }else{
        const old_table_data = old_table.data
        old_output_solve_idxs = old_table.output_solve_idxs.map(idx_pair => {return idx_pair[1]}) //! only valid for single row of solve table (where first index doesnt matter)
        var old_vars = old_table_data[0]
        var trans_table = transpose(old_table_data)
        var n_col = old_table_data.length
    }

    const new_vars = get_all_vars(eqns)

    var new_trans_table = []

    new_vars.forEach((new_var)=>{
        var old_idx = old_vars.indexOf(new_var)
        let new_row
        if (old_idx!==-1){  // if old_table is undefined, it should never enter this branch (since old_vars is empty)
            new_row = trans_table[old_idx]
        }else if (for_solving){
            new_row = Array(n_col).fill("")
            new_row[0] = new_var
        }else if(default_vis_vals !== undefined){
            const cleaned_var = remove_char_placeholders(new_var)
            const default_val = String(default_vis_vals[cleaned_var])
            new_row = Array(n_col).fill(default_val)
            new_row[0] = new_var
        }else{
            new_row=Array(n_col).fill(new_var)
        }
        new_trans_table.push(new_row)
    })


    const table = transpose(new_trans_table)
    // perform substitutions:
    var all_eqns = []
    var var_row = table[0]
    const solve_steps = []

    const error_msgs = []

    
    const var_row_idxs = [...var_row.keys()]

    let output_solve_idxs

    if (for_solving){

        output_solve_idxs = var_row_idxs.filter(idx => {

            const new_var = var_row[idx]
    
            const new_var_idx = old_vars.indexOf(new_var)
    
            const is_idx_of_new_var = new_var_idx == -1
    
            const was_output_before = old_output_solve_idxs.includes(new_var_idx) 
    
            return is_idx_of_new_var || was_output_before
    
        })

    }else{
        output_solve_idxs = []
    }
        



    const output_vars = output_solve_idxs.map(idx => {
        return new_vars[idx]
    })

    for (let i=1;i<table.length;i++){
        var sub_row = table[i]
        var removed_vars = []
        var eqns_subbed = [...eqns]
        // eqns_subbed = sub_vis_vars(eqns_subbed,block_name,i) 


        const sub_in = []
        const sub_out = []


        for (let j=0;j<sub_row.length;j++){



            // const check_same_elements = (arr1,arr2) => {return JSON.stringify(arr1)===JSON.stringify(arr2)}

            const is_output_field = output_vars.includes(var_row[j])

            // const is_output_field = output_solve_idxs.some(idxs => {return check_same_elements(idxs,[i,j])})



            vis_sub = true



            if (sub_row[j] === ""){
                removed_vars.push(var_row[j])
                vis_sub = false
            }else if (!is_output_field){
                sub_in.push(var_row[j])

                sub_out.push(sub_row[j])
            }
        }




        const new_eqns_subbed = eqns_subbed.map(eqn => {return sub_all_vars(eqn, sub_in, sub_out)})

        const sub_steps = []

        eqns_subbed.forEach((old_eqn,idx)=>{

            const new_eqn = new_eqns_subbed[idx]
            
            const was_changed = old_eqn.replaceAll(" ","") !== new_eqn.replaceAll(" ","") 
            const is_visual = old_eqn.includes("VISUAL")

            if (was_changed && !is_visual){
                sub_steps.push([old_eqn, new_eqn])
            }
        })

        if (for_solving){
            GLOBAL_solve_stuff.steps = {sub: sub_steps, back: [], forward: []}
        }

        
        eqns_subbed = new_eqns_subbed

        try{    

            removed_vars.forEach(remove_var => {
                if(sub_out.includes(remove_var)){
                    //VAR
                    throw new FormatError(`Variable ${remove_var} is being removed but is also a substitution output, not allowed`)
                }
            })
            
            const is_visual = default_vis_vals !== undefined
            
            const colors = [...Object.keys(color_map)]

            const is_valid_color = (field) => {

                return field.includes("color") || colors.includes(field)
            }



            var_row.forEach((var_cell,col_idx)=>{

                const sub_cell = sub_row[col_idx]
            
                if (sub_cell.includes("=")){
                    throw new FormatError("Cannot substitute an equation")
                }

                if(sub_cell !== ""){
                    do_other_syntax_checks(sub_cell)
                    eqn_to_tree(ltx_to_math(sub_cell))
                }

                const is_color_cell = var_cell.includes("color")


                if (is_visual && sub_cell === ""){
                    throw new FormatError("cannot have an empty cell for a visual")
                }

                if (is_color_cell && !is_valid_color(sub_cell)){
                    throw new FormatError(`${var_cell} must either be a variable with color in it or be one of: ${colors.join(", ")}`)
                }

                if (!is_color_cell && sub_cell.includes("color")){
                    // can't check if it isValidColor since you could have something like "y" subbed which is sometimes fine
                    throw new FormatError("Cannot substitute variable with 'color' for a noncolor variable")

                }

            })


            if (for_solving){
                sub_row.forEach((sub_cell,idx)=> {
                    const var_cell = var_row[idx]
                    const is_color_input = var_cell.includes("color")

                    if (is_color_input && !is_valid_color(sub_cell)){
                        throw new FormatError(`Solving input for a color must be one of: ${colors.join(", ")}`)
                    }
                    
                    if(!is_color_input && isNaN(sub_cell)){
                        throw new FormatError("When solving, can only substitute numbers")
                    }
                })
            }

            if (for_solving){
                const stuff = solve_eqns(eqns_subbed)
                eqns_subbed = stuff[0]
                solve_steps.push(stuff[1]) // amazing code (---:
                
            }else{
                eqns_subbed = remove_vars(eqns_subbed,removed_vars)
            }

            fuck_my_life_push_to_equation_visuals_but_check_first(eqns_subbed)
           

          
        }catch(error){
            solve_error_types = [ContradictionError, EvaluateError, NumericSolveError, TooMuchUnknownError, CantSolveError, FormatError]
            if (solve_error_types.some((type) => {return error instanceof type})){
                
                let col_idxs = output_solve_idxs

                eqns_subbed = {error: error, output_idxs: col_idxs}

                if (for_solving){
                    GLOBAL_solve_stuff.steps.error = error.message
                }
            }else{
                throw error 
            }

        }
        
        all_eqns.push(eqns_subbed)
        

    }

    // const solved_vis_eqns = all_eqns.flat().filter(eqn => {
    //     if (eqn.error instanceof Error){return false}
    //     const is_vis = eqn.includes("VISUAL")
    //     const all_subbed = get_all_vars(eqn).length === 0

    //     return is_vis && all_subbed
    // })



    // display_vis(solved_vis_eqns)
    // equation_visuals.push(solved_vis_eqns)

    return [all_eqns,table, solve_steps]

    function transpose(matrix) {
        const rows = matrix.length, cols = matrix[0].length;
        const grid = [];
        for (let j = 0; j < cols; j++) {
            grid[j] = Array(rows);
        }
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                grid[j][i] = matrix[i][j];
            }
        }
        return grid;
    }



}










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


    // clear the solve steps from the previous step
    $("#solve-steps")[0].innerHTML = ""


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




    for (var SoE_i=start_idx;SoE_i<end_idx;SoE_i++){
        var SoE_struct=SoEs[SoE_i];
        var name=SoE_struct.name;
        var SoE=SoE_struct.eqns;

        if (known_SoEs.includes(name)){
            SoE_struct.result = new FormatError('"'+name+'"'+' is already a block name')
        }else if(name.length===0){
            SoE_struct.result = new FormatError("Block name cannot be blank")
        }else if(!(/^\w+$/.test(name))){
            SoE_struct.result = new FormatError("Block name cannot have math operations")
        }else if(name.includes("_")){
            SoE_struct.result = new FormatError("Block name cannot include underscores")
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
                solve_error_types = [ContradictionError, EvaluateError, NumericSolveError, TooMuchUnknownError, InvalidReference, FormatError, CantSolveError]
                if (solve_error_types.some((type) => {return error instanceof type}) && error_in_UI){
                    SoEs[SoE_i].eqns[line_i].sub_table=undefined
                    SoEs[SoE_i].eqns[line_i].result=error
                }else{
                    if (typeof error==="object"){console.log(error.msg)}
                    throw error
                }
            }
        }
        known_SoEs.push(name)
    }


    prev_SoEs = SoEs

    // vis_eqns are the eqns to visualize, will figure out the visual by the variable names
    return SoEs


    

    function parse_eqn_input(line,old_table,block_name){

        function get_ref_eqns(ref){

            // gets the equations of a block, ref is the name of the block

            var ref_idx = known_SoEs.findIndex((element) => element === ref)

            if (block_name===ref){
                throw new InvalidReference("Cannot reference own block")
            }else if(ref_idx===-1){
                if(all_SoE_names.includes(ref)){
                    throw new InvalidReference("Cannot reference future block")
                }else{
                    throw new InvalidReference('"'+ref+'"'+' is not an equation or block name')
                }
            }
            
            


            if (ref_idx<start_idx){
                var ref_SoEs = prev_SoEs
            }else{
                var ref_SoEs = SoEs
            }
            var ref_SoE=ref_SoEs[ref_idx].eqns
            var eqns = []
            if (ref_SoEs[ref_idx].result instanceof Error){
                throw new InvalidReference(ref+" has an error")
            }
            ref_SoE.forEach(ref_line => {
                var ref_eqns = ref_line.result
                if (ref_eqns===undefined){
                    boop
                }
                if (ref_eqns instanceof Error){
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

        line = line.replaceAll("\\ ","")

        var vis_vars = []
        match_vis_blocks = vis_blocks.filter((vis_block)=>{return vis_block["name"]===line})

    
        var new_table = undefined // removes table unless there is a substitution (removes if obsolete)


        const solve_txt = "\\operatorname{solve}"

        const solve_line = line.startsWith(solve_txt)

        const solve_txt_once = line.indexOf(solve_txt) === line.lastIndexOf(solve_txt)

        const has_solve_txt = line.includes(solve_txt)

        if (has_solve_txt && !solve_line ){
            throw new FormatError("solve keyword must occur once at the start of the line")
        }

        if (has_solve_txt && !solve_txt_once){
            throw new FormatError("solve keyword must only occur once in the line")
        }

        line = line.replaceAll(solve_txt,"")

    
        let solve_steps
        if (line.length===0){
            if(solve_line){
                throw new FormatError("solve must be followed by block name")
            }
        }else if(!(/^\w+$/.test(line))){    // checks if not alphanumeric (also allows underscores)

            var eqn_split = line.split("=")

            if (eqn_split.length===1){
                throw new FormatError("Expression not allowed, only equation or block reference")
            }else if (eqn_split.length>2){
                throw new FormatError("Only single equation allowed")
            }else if (eqn_split.some((exp)=>{return exp.length==0})){
                throw new FormatError("Terms on both side of equal sign required")
            }else if(get_all_vars(line).includes(block_name)){
                throw new FormatError("cannot have the name of the block as a variable")
            }else{
                
                var line_math = ltx_to_math(line) // before getallvars so it catches 3a=4 (issue with invalid variable, not no variables!)

                if (get_all_vars(line).length===0){
                    throw new FormatError("Equation must have variables")
                }

                const simplified_eqn = tree_to_eqn(eqn_to_tree(line_math), true)

                if (get_all_vars(simplified_eqn).length === 0){
                    throw new FormatError(`Equation simplifies to something without variables: ${simplified_eqn}`)
                }

                var result = [simplified_eqn]
            }

        }else if(match_vis_blocks.length!==0){
            // primitive visual
            var result = []

            const vis_block = match_vis_blocks[0]

            const vis_vars = Object.keys(vis_block.vars)
            const default_vals = Object.values(vis_block.vars).map(val=>{return String(val)})

            const vis_eqn = vis_vars.map(vis_var=>{
                return vis_var+"|"
            }).join("")+"VISUAL"+line


            if (old_table === undefined){
                old_table = [vis_vars,default_vals]
            }

            var new_stuff = compute_sub_table([vis_eqn],old_table)

            var result = new_stuff[0].flat()
            var new_table = new_stuff[1]

        }else if(solve_line){
            //SOLVE need to substitute variables
            var eqns = get_ref_eqns(line)
            //VIS need to return visuals
            const stuff = solve_eqns(eqns)
            result = stuff[0]
            solve_steps = stuff[1]
        }else{
            // nonvisual reference without solve, so substitute:
            var eqns = get_ref_eqns(line)
            
            const has_vars = get_all_vars(eqns).length > 0

            if (has_vars){
                var new_stuff = compute_sub_table(eqns,old_table,block_name)
                var eqns = new_stuff[0]
                var new_table = new_stuff[1]
            }else{
                var eqns = [eqns]
                var new_table = undefined
            }


            result = eqns
            
        }



        // at the very end, will round the numbers 
        SoEs[SoE_i].eqns[line_i].result=result;
        SoEs[SoE_i].eqns[line_i].sub_table = new_table

        if (solve_line){
            SoEs[SoE_i].eqns[line_i].solve_steps = solve_steps   
        }

    }


}

function find_vis_name(eqn) {

    const expression = eqn.split("=")[0]

    return expression.split("VISUAL")[1]

    const substring = "VISUAL"
    const startIndex = eqn.indexOf(substring);
    if (startIndex !== -1) {
        const endIndex = startIndex + substring.length;
        return eqn.substring(endIndex);
    }
    throw "VISUAL not found, shouldnt happen"
}


function display_vis(vis_eqns){

    resetGS()

    vis_eqns.forEach(eqn=>{
        const vis_name = find_vis_name(eqn)

        const sel_vis_blocks = vis_blocks.filter((block)=>{return block.name === vis_name})

        if (sel_vis_blocks.length !== 1){throw "should have had exactly one vis???"}

        const sel_vis = sel_vis_blocks[0]


        const vis_vars = Object.keys(sel_vis.vars)
        const vis_exps = eqn.split("|")
        
        vis_exps.pop()

        const vis_input = {}

        if (vis_vars.length !== vis_exps.length){throw "should be same argument length"}
        vis_vars.forEach((_,i)=>{
            const vis_var = vis_vars[i]
            const vis_exp = vis_exps[i]
            try{
                var vis_val = math.evaluate(vis_exp)
            }catch{
                throw "could not solve for all values for visual "+vis_name+" shouldnt happen??"
            }                
            vis_input[vis_var] = vis_val
        })
        

        sel_vis.vis(vis_input)


    })

    //makeCoordShape()
}

function compute_sub_table(eqns,old_table){
    // takes the new eqns and the current table, replaces the columns to match the variables in the new eqns, then performs substitutions

    if(old_table===undefined){  // the table hasn't been created yet
        var old_vars = []
        var n_col = 2
    }else{

        var old_vars = old_table[0]
        var trans_table = transpose(old_table)
        var n_col = old_table.length
    }

    
    var new_vars = get_all_vars(eqns)

    var new_trans_table = []

    new_vars.forEach((new_var)=>{
        var old_idx = old_vars.indexOf(new_var)
        if (old_idx!==-1){  // if old_table is undefned, it should never enter this branch (since old_vars is empty)
            new_trans_table.push(trans_table[old_idx])
        }else{
            var new_var_row=Array(n_col).fill(new_var)
            new_trans_table.push(new_var_row)
        }
    })

    table = transpose(new_trans_table)

    // perform substitutions:
    var all_eqns = []
    var var_row = table[0]

    const error_msgs = []

    for (let i=1;i<table.length;i++){
        var sub_row = table[i]
        var removed_vars = []
        var eqns_subbed = [...eqns]
        // eqns_subbed = sub_vis_vars(eqns_subbed,block_name,i) 


        const sub_in = []
        const sub_out = []

        for (let j=0;j<sub_row.length;j++){
            vis_sub = true
            if (sub_row[j].includes("=")){
                throw new FormatError("cannot subsitute an equation")
            }
            if (sub_row[j] === ""){
                removed_vars.push(var_row[j])
                vis_sub = false
            }else{
                sub_in.push(var_row[j])
                sub_out.push(sub_row[j])
            }
        }

        eqns_subbed = eqns_subbed.map(eqn => {return sub_all_vars(eqn, sub_in, sub_out)})
        
        all_eqns.push(remove_vars(eqns_subbed,removed_vars))

    }

    const solved_vis_eqns = all_eqns.flat().filter(eqn => {
        const is_vis = eqn.includes("VISUAL")
        const all_subbed = get_all_vars(eqn).length === 0

        return is_vis && all_subbed
    })

    display_vis(solved_vis_eqns)

    return [all_eqns,table]

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









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
            SoE_struct.result = "ERROR"
            SoE_struct.display = '"'+name+'"'+' is already a block name'
        }else if(name.length===0){
            SoE_struct.result = "ERROR"
            SoE_struct.display = "Block name cannot be blank"
        }else if(name.includes("_")){
            SoE_struct.result = "ERROR"
            SoE_struct.display = "Block name cannot include underscores"
        }else if(/\d/.test(name)){
            SoE_struct.display = "Block name cannot include numbers"
        }else{
            SoE_struct.result = ""
            SoE_struct.display = ""
        }

        for (var line_i=0;line_i<SoE.length;line_i++){
            //parse_eqn_input(SoE[line_i].input,SoE[line_i].sub_table,name)
            // TODO make this neater (maybe make a variable branch it)
            try{
                parse_eqn_input(SoE[line_i].input,SoE[line_i].sub_table,name)
            }catch(error){
                if (typeof error==="string"){
                    SoEs[SoE_i].eqns[line_i].result="ERROR";
                    SoEs[SoE_i].eqns[line_i].display=error;
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
                throw "Cannot reference own block"
            }else if(ref_idx===-1){
                if(all_SoE_names.includes(ref)){
                    throw "Cannot reference future block"   
                }else{
                    throw '"'+ref+'"'+' is not an equation or block name'
                }
            }
            
            


            if (ref_idx<start_idx){
                var ref_SoEs = prev_SoEs
            }else{
                var ref_SoEs = SoEs
            }
            var ref_SoE=ref_SoEs[ref_idx].eqns
            var eqns = []
            if (ref_SoEs[ref_idx].result==="ERROR"){throw ref+" has an error"}
            ref_SoE.forEach(ref_line => {
                var ref_eqns = ref_line.result
                if (ref_eqns===undefined){
                    boop
                }
                if (ref_eqns==="ERROR"){throw ref+" has an error"}
    
    
                eqns.push(ref_eqns)
                eqns = eqns.flat()
            });
            return eqns
        }

        /*
        line = line.replaceAll("\\ ","").replaceAll(" ","")
        line = strip_text(line)
        */

        line = line.replaceAll("\\ ","")

        var vis_vars = []
        match_vis_blocks = vis_blocks.filter((vis_block)=>{return vis_block["name"]===line})

        var display = []
        var new_table = undefined // removes table unless there is a substitution (removes if obsolete)


        const solve_txt = "\\operatorname{solve}"

        const solve_line = line.startsWith(solve_txt)

        const has_solve_txt = line.includes(solve_txt)

        if (has_solve_txt && !solve_line){
            throw "solve keyword must be at start of line"
        }

        line = line.replaceAll(solve_txt,"")

    
        if (line.length===0){
            if(solve_line){throw "solve must be followed by block name"}
            else{throw "Line cannot be blank"}
        }else if(!(/^\w+$/.test(line))){    // checks if not alphanumeric (also allows underscores)

            var eqn_split = line.split("=")

            if (eqn_split.length===1){
                throw "Expression not allowed, only equation or block reference"
            }else if (eqn_split.length>2){
                throw "Only single equation allowed"
            }else if (eqn_split.some((exp)=>{return exp.length==0})){
                throw "Terms on both side of equal sign required"
            }else{
                
                var line_math = ltx_to_math(line)

                line_math = convert_to_degrees(line_math)
                
                if (get_all_vars(line_math).length===0){
                    throw "Equation must have variables"
                }
                var result = [line_math]
                display = [line]
            }

        }else if(match_vis_blocks.length!==0){
            // primitive visual
            var result = [] // no result or display

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
            var display = result
            var new_table = new_stuff[1]

        }else if(solve_line){
            var eqns = get_ref_eqns(line)



            let vis_eqns     = eqns.filter(eqn=>{return eqn.includes("VISUAL")})
            const non_vis_eqns = eqns.filter(eqn=>{return !eqn.includes("VISUAL")})

        
            var sol_exps = solve_eqns(non_vis_eqns)

            var result = []
            var display = []
            sol_exps.forEach(sol=>{
                var frac = sol.exp
                var frac_comps = frac.split("/")
                if (frac_comps.length===1){var val = frac_comps[0]}
                else{var val = frac_comps[0]/frac_comps[1]}
                const n_dec_place = 5
                const rounded_value = Math.round(val*10**n_dec_place)/(10**n_dec_place)
        
                result.push(math_to_ltx(sol.var)+"="+val)
                display.push(math_to_ltx(sol.var)+"="+rounded_value)
            })
        
            const sub_in = sol_exps.map(sol=>{return sol.var})
            const sub_out = sol_exps.map(sol=>{return sol.exp})
            vis_eqns = vis_eqns.map(eqn=>{

                sub_in.forEach((_,i)=>{
                    eqn = sub_all_vars(eqn,sub_in[i],sub_out[i])
                })
                return eqn
            })

            display_vis(vis_eqns)
           

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
                var new_table = [[]]
            }

            var result = []

            eqns.forEach(eqn_row=>{
                var display_row = []
                display.push(display_row)
                eqn_row.forEach(eqn=>{
                    //var exp = eqn.split("=")[0]

                    // use_sympy is undefined if a worker's being used
                    if(typeof use_sympy==="undefined" || use_sympy){
                        var simp_exp = sympy_simplify(eqn)
                        var rounded_exp = RHS
                        var js_exp = make_js_exp(rounded_exp,false)

                        var simp_eqn = simp_exp+"=0"
                        var disp_eqn = js_exp+"=0"
                    }else{
                        var simp_eqn = eqn
                        var disp_eqn = eqn
                    }
    
                    result.push(simp_eqn)
                    display_row.push(math_to_ltx(disp_eqn))

                })
            })
        }


        SoEs[SoE_i].eqns[line_i].result=result;
        SoEs[SoE_i].eqns[line_i].sub_table = new_table
        SoEs[SoE_i].eqns[line_i].display=display;
    }


}

function find_vis_name(eqn) {
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
        // TODO for this to work eqn_to_exp would have to ignore it
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
                throw "could not solve for all values for visual "+vis_name
            }                
            vis_input[vis_var] = vis_val
        })

        sel_vis.vis(vis_input)


    })

    makeCoordShape()
}

function compute_sub_table(eqns,old_table_ltx){
    // takes the new eqns and the current table, replaces the columns to match the variables in the new eqns, then performs substitutions

    if(old_table_ltx===undefined){  // the table hasn't been created yet
        var old_vars = []
        var n_col = 2
    }else{

        var old_table = old_table_ltx.map(row=>{
            return row.map(exp=>{
                try{
                    return ltx_to_math(exp)
                }catch{
                    throw "error with "+sub_out_ltx+": "+e
                }
            })
        })

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
    for (let i=1;i<table.length;i++){
        var sub_row = table[i]
        var removed_vars = []
        var eqns_subbed = [...eqns]
        // eqns_subbed = sub_vis_vars(eqns_subbed,block_name,i) 
        for (let j=0;j<sub_row.length;j++){
            var sub_in = var_row[j]
            var sub_out = sub_row[j]
            vis_sub = true




            if (sub_out.includes("=")){
                throw sub_out+" not allowed, cannot substitute an equation"
            }


            if (sub_out === ""){
                removed_vars.push(var_row[j])
                vis_sub = false
            }else if(sub_in === sub_out){
                // do nothing since it's being subbed for the same value      
            }else if(var_row.indexOf(sub_out)!==-1){  // the new variable name is already a variable, not gonna allow that (could get very confusing)  
               // cant handle simultaneous substituions
                throw "Cannot sub "+sub_in+" for "+sub_out+", "+sub_out+" is already a variable"

            }else{
                for (let k=0;k<eqns.length;k++){
                    // eqns_subbed[k]=nerdamer(eqns[k]).sub(sub_in,sub_out).toString()
                    eqns_subbed[k] = sub_all_vars(eqns_subbed[k],sub_in,sub_out)
                }
            }
        }
        all_eqns.push(remove_vars(eqns_subbed,removed_vars))
    }
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



function convert_to_degrees(exp){
    // perform evaluate converting trig arguments to radians
    // also needs to convert inverse trig arguments to degrees


    const trig_funcs = ["sin", "cos", "tan", "csc", "sec", "cot", "sinh", "cosh", "tanh", "csch", "sech", "coth"]

    /*

    sin(a+b) --> sin((a+b)) --> sin(pi/180*(a+b))

    arcsin(a+b) --> sininv((a+b)) --> 180/pi*asin((a+b))

    */


    // keeps conversion at the outer order of operation
    exp = exp.replaceAll("(","((")
    exp = exp.replaceAll(")","))")
    
    const deg2rad = "pi/180"
    const rad2deg = "180/pi"


    // insterting "inv" so the noninverse trig replacement doesn't also replace inverse trig
    trig_funcs.forEach(trig_func=>{
        const before = "arc"+trig_func
        const after = trig_func+"inv"
        exp = exp.replaceAll(before,after)
    })
    

    trig_funcs.forEach(trig_func=>{
        const before = trig_func+"("
        const after = trig_func+"("+deg2rad+"*"
        exp = exp.replaceAll(before,after)
    })

    trig_funcs.forEach(trig_func=>{
        const before = trig_func+"inv"
        const after = rad2deg+"*"+"a"+trig_func
        exp = exp.replaceAll(before,after)
    })

    return exp
}








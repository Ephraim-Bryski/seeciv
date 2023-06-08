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


    // these will be filled if solve is called, and will be returned (can't actually display here since calc is called in a worker)
    var vis_eqns = []




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
    return [SoEs,vis_eqns]


    

    function parse_eqn_input(line,old_table,block_name){

        function get_ref_eqns(ref){

            // TODO delete code to get visual
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
            let visuals = []
            if (ref_SoEs[ref_idx].result==="ERROR"){throw ref+" has an error"}
            ref_SoE.forEach(ref_line => {
                var ref_eqns = ref_line.result
                const ref_visuals = ref_line.visual
                if (ref_eqns===undefined){
                    boop
                }
                if (ref_eqns==="ERROR"){throw ref+" has an error"}
    
    
                
                eqns.push(ref_eqns)
                eqns = eqns.flat()
                
                visuals.push(ref_visuals)
                visuals = visuals.flat()
            });

            //eqns = eqns.filter(eqn=>{return eqn!=="VISUAL"})
            return [eqns,visuals]
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
        }if (line.includes("_")){
            throw "Underscores not allowed"
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

            vis_block = match_vis_blocks[0]

            vis_vars = vis_block["vars"]

            /*
            vis_eqns = vis_vars.map((vis_var,idx)=>{
                return "dummy_"+vis_block["name"]+"_"+vis_var+"="+vis_var
            })
            

            var new_stuff = compute_sub_table(vis_eqns,old_table,block_name)

            var result = new_stuff[0].flat()
            var new_table = new_stuff[1]

            */
            var result = "VISUAL"
            // TODO result should be the equation
            var old_visual = [{
                "name": vis_block.name,
                "sub": []
            }]
            const new_stuff = compute_sub_table([],vis_vars,old_table,old_visual)
            
            var new_table = new_stuff[1]
            var new_visual = new_stuff[2]


        }else if(solve_line){
            [eqns,visuals] = get_ref_eqns(line)
            //TODO filter out visual equations for solve_eqns
            var result = solve_eqns(eqns)
            // TODO sub values from result into visual and evaluate each one
            vis_eqns = result
            result.forEach(eqn=>{
                var sides = eqn.split("=")
                var LHS = sides[0]
                LHS = math_to_ltx(LHS)  // only needed for greek letters
                var RHS = sides[1]
                if(LHS.includes("dummy")){return}
                display.push(LHS+"="+RHS)
            })
        }else{
            // nonvisual reference without solve, so substitute:
            [eqns, visual] = get_ref_eqns(line)
 
            const has_vars = get_all_vars(eqns).length > 0

            if (has_vars){
                var new_eqns
                var new_table
                var new_visual
                [new_eqns, new_table, new_visual] = compute_sub_table(eqns,noneqn_vars,old_table,visual)
                //var eqns = new_stuff[0]
                //var new_table = new_stuff[1]
            }else{
                var new_eqns = [eqns]
                var new_table = [[]]
            }

            var result = []

            new_eqns.forEach(eqn_row=>{
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

        if (new_visual===undefined){
            new_visual = []
        }

        SoEs[SoE_i].eqns[line_i].result = result;
        SoEs[SoE_i].eqns[line_i].sub_table = new_table
        SoEs[SoE_i].eqns[line_i].display = display;
        SoEs[SoE_i].eqns[line_i].visual = new_visual
    }


}



function compute_sub_table(eqns0,old_table){
    // takes the new eqns and the current table, replaces the columns to match the variables in the new eqns, then performs substitutions

    if(old_table===undefined){  // the table hasn't been created yet
        var old_vars = []
        var n_col = 2
    }else{
        var old_vars = old_table[0]
        old_vars = old_vars.map(old_var=>{return ltx_to_math(old_var)})
        var trans_table = transpose(old_table)
        var n_col = old_table.length
    }

    
    var new_vars = get_all_vars(eqns0).concat(noneqn_vars)

    var new_trans_table = []

    new_vars.forEach((new_var)=>{
        var old_idx = old_vars.indexOf(new_var)
        if (old_idx!==-1){  // if old_table is undefned, it should never enter this branch (since old_vars is empty)
            new_trans_table.push(trans_table[old_idx])
        }else{
            var new_var_row=Array(n_col).fill(math_to_ltx(new_var))
            new_trans_table.push(new_var_row)
        }
    })

    table = transpose(new_trans_table)

    // perform substitutions:
    var all_eqns = []
    var var_row = table[0]
    let all_visuals = []
    const ordered_subs = []
    for (let i=1;i<table.length;i++){
        var sub_row = table[i]
        var removed_vars = []
        var eqns_subbed = [...eqns0]
        //eqns_subbed = sub_vis_vars(eqns_subbed,block_name,i) 
        for (let j=0;j<sub_row.length;j++){
            var sub_in = ltx_to_math(var_row[j]) // ltx_to_math just for greek variables
            var sub_out_ltx = sub_row[j]
            vis_sub = true



            try{
                var sub_out = ltx_to_math(sub_out_ltx)
            }catch(e){
                throw "error with "+sub_out_ltx+": "+e
            }

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
        var eqns, ordered_sub
        [eqns, ordered_sub] = remove_vars(eqns_subbed,removed_vars)

        all_eqns.push(eqns)//

        ordered_subs.push(ordered_sub)


        /*
        visual.forEach(el=>{
            const sub = el.sub
            const new_sub = sub.concat(ordered_sub)
            el.sub = new_sub

        })  
        all_visuals.push(visual)
        all_visuals = all_visuals.flat()
        
        */
        /*

        visual would have structure

        [
            {name: Box, values: [x:,y: etc], sub: {a: 3, b: a+4 etc.}}
            {name: Box, values: [x:,y: etc], sub: {a: 5, b: a+4 etc.}}
        ]

        would have to copy it for each row, then add the same stuff to sub for each
            requires a deep clone (parse and stringify)

            s

        if there's multiple rows

        would have to create copys of the visuals for each sub
        then for each of them, add in the ordered sub
        */
        
    }
    return [all_eqns, table, all_visuals]

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



    function sub_vis_vars(eqns,block_name,sub_idx){
        // adds to visual variable to keep trace of all blocks it passed through

        var new_eqns = []

        eqns.forEach(eqn=>{
            var vars = get_all_vars(eqn)
            var vis_vars = vars.filter((test_var)=>{return test_var.includes("dummy")})
            vis_vars.forEach(vis_var_in=>{
                // adds a new part to the visual variable name
                var broken_var = vis_var_in.split("_")
                broken_var.splice(1,0,block_name+sub_idx)
                var vis_var_out = broken_var.join("_")
                eqn = sub_all_vars(eqn,vis_var_in,vis_var_out)
            })
            new_eqns.push(eqn)
        })
        return new_eqns
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








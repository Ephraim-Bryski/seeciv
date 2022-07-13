function calc(SoEs){

    // getting all block names to check if a variable is called the same thing as any block, and to give different type of error if reference to future block:
    var all_SoE_names = []
    SoEs.forEach((SoE)=>{
        all_SoE_names.push(SoE.name)
    })
    //! once im back online i can use nerdamer to get the variables


    var known_SoEs=[];
    var known_SoEs_idx=[];

    for (var SoE_i=0;SoE_i<SoEs.length;SoE_i++){
        var SoE_struct=SoEs[SoE_i];
        var name=SoE_struct.name;
        var SoE=SoE_struct.eqns;

        if (known_SoEs.includes(name)){
            SoE_struct.result = "ERROR"
            SoE_struct.display = name+" is already a block name"
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
                    throw error
                }
            }
        }
        known_SoEs.push(name)
        known_SoEs_idx.push(SoE_i)
    }




    function parse_eqn_input(line,old_table,block_name){
        if (line.includes("solve ")){
            var solve_eqn = true
            line = line.replace("solve ","")
            if (line.includes(" for ")){
                var line_var = line.split(" for ")
                var line = line_var[0]
                var solve_var = line_var[1]
            }else{
                var solve_var = []
            }
        }else{
            var solve_eqn = false
        }


        //! easer to catch errors with regexp i think but for now it's ok

        if (line.includes("=")){
            line = add_lead_zero(line)
            try{(nerdamer(line))}catch{throw line+" is not a valid equation"}
            var eqns = [line]
        }else{
            var ref_and_sub = line.split(" sub")
            ref = ref_and_sub[0].replace(" ","") // remove any extra spaces

            if (block_name===ref){
                throw "Cannot reference own block"
            }
            if(!known_SoEs.includes(ref)){
                if(all_SoE_names.includes(ref)){
                    throw "Cannot reference future block"
                }else{
                    throw "Must be an equation or block name"
                } 
            }

            var ref_idx = known_SoEs.findIndex((element) => element === ref)
            
            ref_SoE=SoEs[ref_idx].eqns;

            var eqns = []

            if (SoEs[ref_idx].result==="ERROR"){throw ref+" has an error"}
            ref_SoE.forEach(ref_line => {
                var ref_eqns = ref_line.result
                if (ref_eqns==="ERROR"){throw ref+" has an error"}
                eqns.push(ref_eqns)
                eqns = eqns.flat()

                

                /*
                ref_eqns.forEach(ref_eqn =>{
                    if (ref_and_sub.length>1){ // there is substitution
                        var sub_eqns = ref_and_sub[1].split(",")
                        sub_eqns.forEach(sub_eqn => {
                            if (sub_eqn.length===0){throw "Invalid substitution syntax"}
                            var sub_terms = sub_eqn.split(":")
                            try{nerdamer(sub_terms)}catch{throw "Invalid substitution terms"}
                            var sub_in = sub_terms[0]
                            var sub_out = sub_terms[1]
                            ref_eqn = ref_eqn.replace(sub_in,sub_out)
                        })
                    }
                    eqns.push(ref_eqn)
                    eqns.flat()
                })
                */
            });
            
            if (ref_and_sub.length>1){
                var new_stuff = compute_sub_table(eqns,old_table)
                var eqns = new_stuff[0]
                var new_table = new_stuff[1]
            }
            
        }
        
        if (solve_eqn){
            if (solve_var.length===0){
                var result = solve_eqns(eqns)
            }else{
                var result = solve_eqns_for(eqns,solve_var)
            }
        }else{
            var result = eqns
        }


        var display = []


        result.forEach(eqn => {
            display = display+eqn+","
        })
        display = display.slice(0, -1)
        SoEs[SoE_i].eqns[line_i].result=result;
        SoEs[SoE_i].eqns[line_i].sub_table = new_table
        SoEs[SoE_i].eqns[line_i].display=display;
    }
    return SoEs
}


// not used (replaced with solve_for_vars):
function solve(eqns,solve_var){
    try {
        var sols = nerdamer.solveEquations(eqns)
    
    } catch {
        throw "could not solve"
    }
    if (sols.length===0){throw "could not solve"}
    if (!Array.isArray(sols[0])){     
        sols=[sols]
    }
    
    var sols_txt = []
    sols.forEach(sol => {
        if (solve_var.length===0 || solve_var===sol[0]){
            sols_txt.push(sol[0]+"="+sol[1].toString())
        }    
    });
    return sols_txt
}

    
// not used:
function get_vars(str){
    let regexp = /\W(?=\D)(?=\w)\w+/g
    let matches = [...str.matchAll(regexp)];
    var vars=[]
    matches.forEach((match) => {      
        vars.push(match[0].substring(1))
    });
    return vars
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
    for (let i=1;i<table.length;i++){
        var sub_row = table[i]
        var removed_vars = []
        var eqns_subbed = [...eqns]
        for (let j=0;j<sub_row.length;j++){
            var sub_in = var_row[j]
            var sub_out = sub_row[j]
            if (sub_out===""){
                removed_vars.push(var_row[j])
            }else if(sub_in===sub_out){
                // do nothing since it's being subbed for the same value      
            }else if(var_row.indexOf(sub_out)!==-1){  // the new variable name is already a variable, not gonna allow that (could get very confusing)  
                throw "cannot sub "+sub_in+" for "+sub_out+", "+sub_out+" already variable"

            }else{
                for (let k=0;k<eqns.length;k++){
                    // eqns_subbed[k]=nerdamer(eqns[k]).sub(sub_in,sub_out).toString()
                    eqns_subbed[k] = sub_vars(eqns_subbed[k],sub_in,sub_out)
                }
            }         
        }
        all_eqns.push(remove_vars(eqns_subbed,removed_vars))
    }
    return [all_eqns.flat().flat(),table]

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





function calc(SoEs){
    var known_SoEs=[];
    var known_SoEs_idx=[];

    for (var SoE_i=0;SoE_i<SoEs.length;SoE_i++){
        var SoE_struct=SoEs[SoE_i];
        var name=SoE_struct.name;
        var SoE=SoE_struct.eqns;

        for (var line_i=0;line_i<SoE.length;line_i++){
            try{
                parse_eqn_input(SoE[line_i].input)
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




    function parse_eqn_input(line){
        console.log(line)
        if (line.includes("solve ")){
            var solve_eqn = true
            line = line.replace("solve ","")
            if (line.includes(" for ")){
                console.log(line)
                var line_var = line.split(" for ")
                console.log(line_var)
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
            try{(nerdamer(line))}catch{throw line+" is not a valid equation"}
            var eqns = [line]
        }else{
            var ref_and_sub = line.split(" sub ")
            ref = ref_and_sub[0].replace(" ","") // remove any extra spaces

            if(!known_SoEs.includes(ref)){throw ref+" not equation or block name"}

            var ref_idx = known_SoEs.findIndex((element) => element === ref)
            
            ref_SoE=SoEs[ref_idx].eqns;

            var eqns = []

            ref_SoE.forEach(ref_line => {
                var ref_eqns = ref_line.result
                if (ref_eqns==="ERROR"){throw ref+" has an error"}
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
            });
            
        }
        
        if (solve_eqn){
            var result = solve(eqns,solve_var)
        }else{
            var result = eqns
        }


        var display = []
        result.forEach(eqn => {
            display = display+eqn+","
            console.log(display)
        })
        display = display.slice(0, -1)
        SoEs[SoE_i].eqns[line_i].result=result;
        SoEs[SoE_i].eqns[line_i].display=display;
    }
    return SoEs
}


function solve(eqns,solve_var){
    console.log(eqns)
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
            console.log(sol)
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




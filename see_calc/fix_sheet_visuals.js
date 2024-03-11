/*

handles situation where i update the parameters in a visual
modifies the database directly to match

has to update
    subtable
    visuals global
    results

*/



function deep_search(tree, condition, operation){

    const do_search = tree.constructor === Array || tree.constructor === Object

    if (!do_search){
        return
    }


    const keys = Object.keys(tree)

    for (let key of keys){
        
        const subtree = tree[key] 

        if (condition(subtree)){
            tree[key] = operation(subtree)
        }else{
            deep_search(subtree, condition, operation)
        }
    }

}


function add_variable_to_visual(visual_name){
    
    const selected_visual = vis_blocks.filter(vis => {return vis.name === visual_name})[0]

    const vis_info = selected_visual.vars

    const default_values = [...Object.values(vis_info)]
    const visual_variables = [...Object.keys(vis_info)]

    const n_variables = default_values.length

    const new_default_value = default_values[n_variables-1]
    const new_visual_variable = visual_variables[n_variables-1]
    
    function is_visual_eqn(eqn){
        return typeof eqn === "string" && eqn.endsWith(`VISUAL${visual_name}`)
    }
    
    function update_visual_eqn(eqn){
    
    
        let expression, eqn_rhs
        if (eqn.includes("=")){
            const eqn_parts = eqn.split("=")[0]
        
            expression = eqn_parts[0]
            eqn_rhs = "="+eqn_parts[1]

        }else{
            expression = eqn
            eqn_rhs = ""
        }
    
        const parts = expression.split("|VISUAL")
        let values = parts[0]
        const name = parts[1]
    
        if (name !== visual_name){
            return eqn
        }

        const n_vars_before = values.split("|").length

        if (n_vars_before + 1 !== n_variables){
            throw "there isn't one more variable"
        }


        values += "|"+new_default_value
    
        return `${values}|VISUAL${name}${eqn_rhs}` 
    
    }


    function is_visual_line(line){

        const visual_input = `\\operatorname{visual}${visual_name}`

        return line.constructor === Object && line.input === visual_input
    }

    function update_visual_line(line){
        const sub_table = line.sub_table
        const variables = sub_table[0]
        
        variables.push(new_visual_variable)

        for (let i=1;i<sub_table.length;i++){
            const values = sub_table[i]

            values.push(String(new_default_value))
        }
        return line
    }
 
    deep_search(firebase_data, is_visual_eqn, update_visual_eqn)

    deep_search(firebase_data, is_visual_line, update_visual_line)
}

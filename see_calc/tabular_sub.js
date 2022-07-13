var old_table = [["x","y","z"],["x","","z"],["x","y",""]]


var old_table_DOM = make_sub_table(old_table)

document.body.appendChild(old_table_DOM)


var eqns = ["y=x^2+c","x=2*c"]

var updated = compute_sub_table(eqns,old_table)

var new_eqns = updated[0]
var new_table = updated[1]

console.log(new_eqns)



document.body.appendChild(make_sub_table(new_table))



// moved to compute_sheet
function compute_sub_table(eqns,old_table){
    // takes the new eqns and the current table, replaces the columns to match the variables in the new eqns, then performs substitutions


    // update table:
    var trans_table = transpose(old_table)
    var new_vars = get_all_vars(eqns)
    var old_vars = old_table[0]

    var new_trans_table = []

    new_vars.forEach((new_var)=>{
        var old_idx = old_vars.indexOf(new_var)
        if (old_idx!==-1){
            new_trans_table.push(trans_table[old_idx])
        }else{
            var new_var_row=Array(old_table.length).fill(new_var)
            new_trans_table.push(new_var_row)
        }
    })

    table = transpose(new_trans_table)
    console.log(table)

    // perform substitutions:
    var eqns_subbed = []
    var var_row = table[0]
    for (let i=1;i<table.length;i++){
        var sub_row = table[i]
        var removed_vars = []
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
                    eqns[k]=nerdamer(eqns[k]).sub(sub_in,sub_out).toString()
                }
            }         
        }
        eqns_subbed.push(remove_vars(eqns,removed_vars))
    }
    return [eqns_subbed,table]
}















document.addEventListener('keyup', (e)=>{
    if (e.code==="Enter"){
        if (e.ctrlKey){
            update(["a","b","c"])   // in reality it would use the equation referenced
    }          
}})


function update(vars){
    var root = document.getElementById("root")
    var ref = document.getElementById("ref")
    if(root.children.length===1){ // checking if table, in reality, it would compare it to larger value
        var init_data = []
        for (let i=0;i<2;i++){
            init_data.push([])
            for (let j=0;j<vars.length;j++){
                init_data[i].push([vars[j],vars[j]])
            }
        }
        console.log(init_data)
        root.appendChild(make_sub_table(init_data))
    }else{
        console.log(root.children[1])
        var table = make_sub_table(get_sub_data(root.children[1]))
        root.removeChild(root.children[1])
        root.appendChild(table)
    }
}




// moved to see_calc
function make_sub_table(table_data){
    var table = document.createElement("span")
    var vars = []

    for (let i=0;i<table_data.length;i++){
        if (i===0){var editable = false}
        else{var editable = true}
        table.appendChild(make_row(table_data[i],editable))
    }


    for (let i=0;i<vars.length;i++){
        // this replaces the input field
        table.children[0].children[i].innerHTML=vars[i]
    }

    var btn_row = document.createElement('tr')
    var add_btn = document.createElement('button')
    add_btn.innerHTML = "+"
    var remove_btn = document.createElement('button')
    remove_btn.innerHTML = "X"


    add_btn.onclick=()=>{
        table.insertBefore(make_row(vars),btn_row)
        console.log(make_row(vars))
    }

    remove_btn.onclick=()=>{
        if (table.children.length>3){
            table.removeChild(btn_row.previousSibling)
        }
    }

    btn_row.appendChild(add_btn)
    btn_row.appendChild(remove_btn)


    table.appendChild(btn_row)
    table.className = "sub-table"



    return table

    function make_row(vars,editable){
        var row = document.createElement("tr")
        vars.forEach((var_name)=>{
            var in_field = document.createElement("input")
            in_field.className = "sub-input"
            if(!editable){
                in_field.disabled = true
                console.log('hi')
            }
            in_field.value = var_name
            var cell = document.createElement("td")
            cell.appendChild(in_field)
            row.appendChild(cell)
        })
        return row
    }
}


// moved to see_calc
function get_sub_data(table){
    var data = []
    var rows = table.children
    // array with each element representing a row of substitutions, each in that representing a substitution, and a 2 element array in that with the input and output
    for (let i=0;i<rows.length-1;i++){
        var row = rows[i]
        var cells = row.children
        data.push([])
        for (let j=0;j<cells.length;j++){
            var cell = cells[j]
            var txt = cell.children[0].value
            data[i].push(txt)
        }
    }
    return data
}



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

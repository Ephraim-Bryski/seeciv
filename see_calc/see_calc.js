var publish = false
var MQ = MathQuill.getInterface(2);


set_up()



var SoEs= [
    {
        name:"System",
        
        eqns: [
        {input: "a=4+b", result: "",display:""},
        {input: "a*b=4", result: "",display:""}
        
        ]
    },
    {
        name:"AnotherSystem",
        eqns: [
        {input: "solve System", result:"",display:""},
               
        ]
    }

]

document.body.SoEs = [] //deep_clone(SoEs)
document.body.computed_SoEs = [] //deep_clone(SoEs)

data2DOM(SoEs)

let pyodide;
async function get_py() {
    document.getElementById("loading").style.display = "block"
    pyodide = await loadPyodide();
    await pyodide.loadPackage("sympy");
    
}
get_py().then(()=>{});


// not used
function animate_load(){
    var load_bar = document.getElementById("load_bar")

    setInterval(move,100)

    var i = 0
    function move() {
        if (i == 0) {
          i = 1;
          var elem = document.getElementById("load_bar");
          var width = 1;
          var id = setInterval(frame, 10);
          function frame() {
            if (width >= 100) {
              clearInterval(id);
              i = 0;
            } else {
              width++;
              elem.style.width = width + "%";
            }
          }
        }
    }
}

function set_up(){
    if (publish){
        document.getElementById("save-field").style.display = "none"
        document.getElementById("save-btn").style.display = "none"
        var sheet_name_file = "Publish Sheet Names"
    }else{
        var sheet_name_file = "Sheet Names"
    }
    
    
    document.getElementById("loading").style.display = "none"
    var load_btn = document.getElementById("load-btn") 
    load_btn.onclick=()=>{
        var sheet_btns = document.getElementsByClassName("sheet-load-btn")
            for (let i=0;i<sheet_btns.length;i++){
                var sheet_btn = sheet_btns[i]
                if (load_btn.innerHTML==="Library"){     
                    sheet_btn.style.display = "block"
                    var new_txt = "Close"
                }else if(load_btn.innerHTML==="Close"){
                    sheet_btn.style.display = "none"
                    var new_txt = "Library"
                }
            }
            load_btn.innerHTML = new_txt
    
        
    }
    load(sheet_name_file,create_load_btns)
    
    
    var save_btn = document.getElementById("save-btn")
    save_btn.onclick=()=>{
        save(DOM2data(),document.getElementById("save-field").value)
    }
    
    document.addEventListener('keyup', (e)=>{
        if (e.code==="Enter"){
            var in_field=document.activeElement
            if (e.ctrlKey){
                var sheet_data=DOM2data()       
                data2DOM(sheet_data)
            }else if(in_field.className=="line-input"){
                var line=in_field.parentNode
                var block=line.parentNode
                var next_line=line.nextElementSibling
                var new_line=make_line()
                block.insertBefore(new_line,next_line)
                new_line.children[1].focus()
            }else if(in_field.className=="block-name-txt"){
                var block=in_field.parentNode.parentNode
                var main=block.parentNode
                var next_block=block.nextElementSibling
                var new_block=make_block()
                main.insertBefore(new_block,next_block)
                new_block.children[0].children[1].focus()
            }
        }          
    })
}


function load(name,func){
    fetch(name+".json")
    .then(response => {
    return response.json();
    })
    .then(jsondata => func(jsondata))
    /*
    .catch(error =>{
        console.log(error)
    })*/  
}
    
function save(data, fileName) {
    var content = JSON.stringify(data,null,2)
    var a = document.createElement("a")
    var file = new Blob([content], {type: 'text/plain'})
    a.href = URL.createObjectURL(file)
    a.download = fileName+".json"
    a.click()
}

function create_load_btns(data){ // this would be data2DOM(data)
    data.forEach(name => {
        var root = document.getElementById("load")
        var btn = document.createElement('button')
        btn.classList.add("sheet-load-btn")
        btn.style.display="none"
        btn.innerHTML=name
        btn.onclick=()=>{
            document.getElementById("save-field").value=name
            load("sheets/"+name,data2DOM)
        }
        root.appendChild(btn)

        
    });
}




function DOM2data(){
    var data=[]
    var outer=document.getElementById('root')
    var not_empty_box_count = 0
    for (let i=0;i<outer.children.length;i++){
        var SoE_box=document.getElementsByClassName('block')[i]
        var name_field = document.getElementsByClassName('block-name-txt')[i].value
        if(name_field.length!==0 || i===0){
            data[not_empty_box_count]={}
            data[not_empty_box_count].name=name_field
            data[not_empty_box_count].eqns=[]
            var not_empty_line_count=0
            for (let j=1;j<SoE_box.children.length;j++){
                var eqn_row=SoE_box.children[j]
                var input=eqn_row.children[1].value
                var sub_table = eqn_row.children[2]
                if(input.length!==0 || j===1){
                    data[not_empty_box_count].eqns[not_empty_line_count]={}
                    data[not_empty_box_count].eqns[not_empty_line_count].input=input
                    data[not_empty_box_count].eqns[not_empty_line_count].sub_table = get_sub_data(sub_table)
                    not_empty_line_count+=1
                }
            } 
            not_empty_box_count+=1 
        }
        
    }
    return data
}

function data2DOM(SoEs,calculate = false){

    //! I think is obsolate (used for ML)
    if(!Array.isArray(SoEs)){
        SoEs=[SoEs]
    }


    var old_SoEs = document.body.SoEs

    // compute where the difference is and pass it over to calc
    console.log("before: ")
    console.log(SoEs)

    var SoEs_cleaned = deep_clone(SoEs)


    console.log(SoEs_cleaned)


   // var SoEs = JSON.parse(JSON.stringify(SoEs)) // a deep clone isn't needed, BUT this eliminates undefined properties so the two match (sub_table is undefined)


    

    console.log("Old: ")
    console.log(old_SoEs)
    console.log("New: ")
    console.log(SoEs_cleaned)


    if (old_SoEs.length === 0){
        var change_idx = 0  // document.body.SoEs is initiated as an empty array
    }else{
        var change_idx = get_change_start(old_SoEs,deep_clone(SoEs_cleaned))
    }
    
    if (change_idx===undefined){
        change_idx = SoEs.length
    }



    var SoEs_old_computed = document.body.computed_SoEs


    if (calculate){
        var SoEs_new_computed = calc(deep_clone(SoEs_cleaned),SoEs_old_computed,change_idx)
    }else{
        var SoEs_new_computed = deep_clone(SoEs_cleaned)
    }
    //
    

    document.body.SoEs = deep_clone(SoEs_cleaned)   // JSON used to create a deep clone

    var SoEs_computed = SoEs_old_computed.slice(0,change_idx).concat(SoEs_new_computed.slice(change_idx))

    document.body.computed_SoEs = deep_clone(SoEs_computed)



    var main = document.getElementById('root');
    while(main.firstChild){
        main.removeChild(main.firstChild);
    }

    for (let i=0;i<SoEs_computed.length;i++){    
        main.appendChild(make_block(SoEs_computed[i]))  
    }


}


function make_line(eqn){
    var line=document.createElement('div')
    line.className = "line"
    var remove_button=document.createElement('button')
    remove_button.innerHTML="X"
    remove_button.onclick=function(event){
        var button=event.target
        var line=button.parentNode
        var outer=line.parentNode

        if (outer.children.length>1){ // one for the name and one for the remaining line
            outer.removeChild(line)
        }
        if (outer.children.length===1){
            outer.appendChild(make_line({"input":"","display":""}))
        }  
    }
    remove_button.className="line-btn"
    remove_button.classList.add("remove-btn")

    var in_field=document.createElement('input')
    in_field.className="line-input"
    


    var out_field=document.createElement('span')
    out_field.className = "line-output"

    var sub_table
    if (eqn!=undefined){
        in_field.value=eqn.input

        var display_eqns = eqn.display

        if (typeof display_eqns === "string"){
            out_field.innerHTML = display_eqns  // this occurs only when it's an error
        }else{
            display_eqns.forEach((eqn)=>{
                var eqn_wrapper = document.createElement("div") // needed since MQ turns the div into a span
                var eqn_field = document.createElement("div")
                eqn_field.innerHTML = eqn
                MQ.StaticMath(eqn_field)
                eqn_wrapper.appendChild(eqn_field)
                out_field.appendChild(eqn_wrapper)
    
        
            })
        }

    


        var sub_table = make_sub_table(eqn.sub_table) //! would need new field for eqn, in compute_sub_table, it would take the equations and old table to generate the new table and update the field
    }else{
        var sub_table = document.createElement("span")  
    }



    line.appendChild(remove_button)
    line.appendChild(in_field)
    line.appendChild(sub_table)
    line.appendChild(out_field)
    return line
}



function make_block(SoE){

    var block=document.createElement('div')

    block.className="block"

    var remove_button=document.createElement('button')
    remove_button.onclick=function(event){
        var button=event.target
        var block=button.parentNode.parentNode
        var outer=block.parentNode

        if (outer.children.length>1){ // one for the name and one for the remaining line
            outer.removeChild(block)
        }
    }
    remove_button.innerHTML="X"
    remove_button.className="block-remove"
    remove_button.classList.add("remove-btn")

    var name_field=document.createElement('input')
    name_field.className="block-name-txt"

    var error_field = document.createElement('span')
    if(SoE!==undefined){   
        error_field.innerHTML = SoE.display
    }else{
        error_field.innerHTML = ""
    }
    block.appendChild(error_field)

    name_line=document.createElement('div')
    name_line.className="block-name"
    name_line.appendChild(remove_button)
    name_line.appendChild(name_field)
    name_line.appendChild(error_field)
    block.appendChild(name_line)





    if (SoE!=undefined){
        name_field.value=SoE.name

        var eqns=SoE.eqns
    
        if(!Array.isArray(eqns)){
            eqns=[eqns]
        }
    
    
        for (let j=0;j<eqns.length;j++){
            
            block.appendChild(make_line(eqns[j]))
            
    
        }
    }else{
        block.appendChild(make_line())
    }
    

    return block
}


//! will be called in make_line
function make_sub_table(table_data){
    var table = document.createElement("span")


    if (table_data!==undefined && table_data.length!==0){
        var vars = table_data[0]
        for (let i=0;i<table_data.length;i++){
            if (i===0){var editable = false}
            else{var editable = true}
            table.appendChild(make_row(table_data[i],editable))
        }
    
        var btn_row = document.createElement('tr')
        var add_btn = document.createElement('button')
        add_btn.innerHTML = "+"
        var remove_btn = document.createElement('button')
        remove_btn.innerHTML = "X"
    
    
        add_btn.onclick=()=>{
            table.insertBefore(make_row(vars,true),btn_row)
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
    
    
    }
    

    return table

    function make_row(vars,editable){
        var row = document.createElement("tr")
        vars.forEach((var_name)=>{
            var in_field = document.createElement("input")
            in_field.className = "sub-input"
            if(!editable){
                in_field.disabled = true
            }
            in_field.value = var_name
            var cell = document.createElement("td")
            cell.appendChild(in_field)
            row.appendChild(cell)
        })
        return row
    }
}


// will be called in DOM2data
function get_sub_data(table){
    if (table.children.length!==0){ // if it's just a placeholder, returns undefined, which is checked in the function call
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
}










function get_change_start(A,B){


    var same_length = false
    if (A.length>B.length){
        var larger = A
        var smaller = B
    }else if(B.length>A.length){
        var larger = B
        var smaller = A
    }else{
        same_length = true
    }

    if(!same_length){
        len_diff = larger.length-smaller.length
        for (let i=0;i<len_diff;i++){
            smaller.push([])
        }
    }

    console.log("AAAAAAAAAAAAAAAA: ")
    console.log(A)
    console.log("BBBBBBBBBBBBB: ")
    console.log(B)

    for (let i=0;i<A.length;i++){
        if(!structures_same(A[i],B[i])){
            return i
        }
        console.log("Same: "+A[i]+" and "+B[i])
    }


    function structures_same(A,B){
// non-nested arrays dont work
        // checks if two nested arrays have the same data
        var Akeys = Object.keys(A)
        var Bkeys = Object.keys(B)

        if (Akeys.length>Bkeys.length){var ref_keys = Akeys}
        else{var ref_keys = Bkeys}


        var match = true

        ref_keys.forEach(key=>{
            A_in = A[key]
            B_in = B[key]

            if (typeof A_in === "object" && typeof B_in === "object"){
                if(structures_same(A_in,B_in)){
                }else{
                    match = false
                }
            }else if(A_in===B_in){
            }else{
                match = false
            }
        })
        return match
    }

}

function deep_clone(nested){
    return JSON.parse(JSON.stringify(nested))
}


function show_loading() {
    var elem = document.getElementById("myBar");   
    var width = 1;
    var id = setInterval(frame, 1000);
    function frame() {
      if (width >= 100) {
        clearInterval(id);
      } else {
        width++; 
        elem.style.width = width + '%'; 
      }
    }
  }
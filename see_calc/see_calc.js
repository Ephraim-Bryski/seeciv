var publish = false

if (publish){
    document.getElementById("save-field").style.display = "none"
    document.getElementById("save-btn").style.display = "none"
    var sheet_name_file = "Publish Sheet Names"
}else{
    var sheet_name_file = "Sheet Names"
}




var SoEs= [
    {
        name:"System",
        
        eqns: [
        {input: "a=b+3", result: "",display:""},
        {input: "a*b=4", result: "",display:""}
        
        ]
    },
    {
        name:"AnotherSystem",
        eqns: [
        {input: "solve System for a", result:"",display:""},
        {input: "c=5",  result:"",display:""}
            
        ]
    },
    {
        name:"AndAnother",
        eqns: [
        {input: "AnotherSystem sub a:c", result:"",display:""},
        
            
        ]
    },
    {
        name:"AndAContradiction",
        eqns: [
        {input: "solve AndAnother", result:"",display:""},
        
            
        ]
    },


]
data2DOM(SoEs)



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

function data2DOM(SoEs){
    var main = document.getElementById('root');
    while(main.firstChild){
        main.removeChild(main.firstChild);
    }


    if(!Array.isArray(SoEs)){
        SoEs=[SoEs]
    }


    SoEs=calc(SoEs)

    for (let i=0;i<SoEs.length;i++){    
        main.appendChild(make_block(SoEs[i]))  
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
        out_field.innerHTML=eqn.display
        //MQ.StaticMath(out_field)


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


    if (table_data!==undefined){
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
    if (table.children.length!==0){ // if it's just a placeholder, just return undefined
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


// i switched from var to const, so rn its just arbitrary which on i use

const user = "eph"    // for now i can just have the user as global since im the only one using it
var MQ = MathQuill.getInterface(2);

document.body.loaded = false    // this keeps track of whether sympy has been loaded, it's only used for when loading a sheet from the library -- if sympy's loaded it should compute, but if not it should just display

set_up()



var SoEs= [
    {
        name:"System",
        info: "hi",
        eqns: [
        {input: "c=a+b", result: "",display:""},
        {input: "a=3", result: "",display:""},
        {input: "b=4", result: "",display:""}
        ]
    },
    {
        name:"AnotherSystem",
        eqns: [
        {input: "solve System", result:"",display:""},
               
        ]
    }

]



const worker = new Worker('py_worker.js');
worker.postMessage("load")



worker.onmessage = (m)=>{
    if (m.data === "loaded"){
        document.addEventListener('keyup', (e)=>{
            if (e.code==="Enter" && e.ctrlKey){
                var sheet_data=DOM2data()
                send_to_worker(sheet_data)
            }
        })
        document.body.loaded = true
        document.getElementById("library-loaded").innerHTML = "Loaded computation library!<br>Press Ctrl+Etr to update calculations."
    }else{  // this means it finished computing
        document.getElementById("library-loaded").innerHTML = ""
        data2DOM(m.data)
    }
}



data2DOM(SoEs)  // performed without calculations



// this would be done onmessage loaded





function set_up(){

    
    
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


    document.addEventListener('keyup', (e)=>{
        if (e.code==="Enter"){
            var in_field=document.activeElement
            if (e.ctrlKey){

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


    const fb_config = {
        apiKey: "AIzaSyCuxcmJLVLR02LNXx6Ep_diD7q7orHCfmM",
        authDomain: "see-calc.firebaseapp.com",
        projectId: "see-calc",
        storageBucket: "see-calc.appspot.com",
        messagingSenderId: "12119172863",
        appId: "1:12119172863:web:b7a71ebd11f9c0c2a90eca",
        databaseURL: "https://see-calc-default-rtdb.firebaseio.com/",
        measurementId: "G-396DG1Y9Q2"
    };
    firebase.initializeApp(fb_config);
    const database = firebase.database().ref();
    
    function add_to_fb(name){

        fetch("sheets/"+name+".json")
        .then(response => {
        return response.json();
        })
        .then(jsondata => {



            database.child(user).child(name).set(JSON.parse(JSON.stringify((jsondata))))  // parse and stringify is just to remove undefined, since firebase cant handle them



        })
        .catch(error =>{
            throw error
        });
    
    
    }




    database.on("value", (package)=>{
        console.log('hi')
        const data = package.val()
        create_callbacks(database,data)
    },
    ()=>{throw "ERROR WITH FIREBASE????"} 
    );

    function create_callbacks(database,data){

        const save_btn = document.getElementById("save-btn")
        save_btn.onclick = ()=>{
            const sheet_name = document.getElementById("save-field").value
            database.child(user).child(sheet_name).set(JSON.parse(JSON.stringify((DOM2data()))))  // parse and stringify is just to remove undefined, since firebase cant handle them
        }
    
    
        const user_data = data[user]
        const current_btns = document.getElementsByClassName("sheet-load-btn")
        const current_names = [...current_btns].map(btn=>{return btn.innerHTML})

        if (current_btns.length === 0){
            var display_type = "none"
        }else{
            var display_type = current_btns[0].style.display
        }

        const sheet_names = Object.keys(user_data)


        const new_names = sheet_names.filter(sheet_name=>{return !current_names.includes(sheet_name)})

        new_names.forEach(sheet_name => {
            var root = document.getElementById("load")
            var btn = document.createElement('button')
            btn.classList.add("sheet-load-btn")
            btn.style.display=display_type
            btn.innerHTML=sheet_name
            btn.onclick=()=>{
                document.getElementById("save-field").value=sheet_name
                const sheet_data = user_data[sheet_name]
                if (document.body.loaded){
                    send_to_worker(sheet_data)
                }else{
                    data2DOM(sheet_data)
                }
            }
            root.appendChild(btn)        
        });
    }
    

}

 /*  approach before using firebase:
function load_files(name,func){
   
    fetch(name+".json")
    .then(response => {
    return response.json();
    })
    .then(jsondata =>func(jsondata))

}


function save(data, fileName) {
    var content = JSON.stringify(data,null,2)
    var a = document.createElement("a")
    var file = new Blob([content], {type: 'text/plain'})
    var url = URL.createObjectURL(file)
    a.href = url
    a.download = fileName+".json"
    a.click()
    URL.revokeObjectURL(url)
}
*/




function send_to_worker(sheet){
    document.getElementById("library-loaded").innerHTML = "Computing..."
    worker.postMessage(sheet)
}



function DOM2data(){
    var data=[]
    var not_empty_box_count = 0
    var SoE_boxes = document.getElementsByClassName('block')
    var name_fields = document.getElementsByClassName('block-name-txt')
    var info_blocks = document.getElementsByClassName('info-box')
    for (let i=0;i<SoE_boxes.length;i++){
        var SoE_box=SoE_boxes[i]
        var name_field = name_fields[i].value
        var info = info_blocks[i].innerHTML
        if(name_field.length!==0 || i===0){
            data[not_empty_box_count]={}
            data[not_empty_box_count].name=name_field
            if (info!=="undefined" && info!==""){
                data[not_empty_box_count].info=info
            }
            data[not_empty_box_count].eqns=[]
            var not_empty_line_count=0
            for (let j=2;j<SoE_box.children.length;j++){
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

    // would just pass in SoEs, but would have to be deepcloned at some point


    var main = document.getElementById('root');
    while(main.firstChild){
        main.removeChild(main.firstChild);
    }

    for (let i=0;i<SoEs.length;i++){    
        main.appendChild(make_block(SoEs[i]))  
    }

    main.appendChild(make_new_block_btn())

    // weird MQ bug, parentheses messed up if you apply staticfield prior to appending to document.body, so this must be done after:
    var mq_fields = main.querySelectorAll('.eqn-field')
    
    mq_fields.forEach((mq_field)=>{
        MQ.StaticMath(mq_field)
    })


}

function make_new_block_btn(){
    var add_btn = document.createElement("button")
    add_btn.className = "info-btn"
    add_btn.innerHTML = "create new block"
    add_btn.onclick = (()=>{
        console.log('clicked!')
        var parent = document.getElementById("root")
        var new_block = make_block()
        parent.insertBefore(new_block,add_btn)

    })
    return add_btn
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

        if (display_eqns === undefined){
            display_eqns = ""
        }


        if (typeof display_eqns === "string"){
            out_field.innerHTML = display_eqns  // this occurs only when it's an error
        }else{
            display_eqns.forEach((eqn)=>{
                var eqn_wrapper = document.createElement("div") // needed since MQ turns the div into a span
                var eqn_field = document.createElement("div")
                eqn_field.innerHTML = eqn
                eqn_field.className = "eqn-field"    // this is done to mathquillify at the end (must be done after appending it to document so parentheses format isnt messed up)
                eqn_wrapper.appendChild(eqn_field)
                out_field.appendChild(eqn_wrapper)
                //MQ.StaticMath(eqn_field)

                
        
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

    var info_btn = document.createElement("button")
    info_btn.classList = "empty-info-btn"


    var name_field=document.createElement('input')
    name_field.className="block-name-txt"

    var error_field = document.createElement('span')

    if (SoE===undefined || SoE.display===undefined){
        error_field.innerHTML = ""
    }else{
        error_field.innerHTML = SoE.display
    }
    block.appendChild(error_field)

    name_line=document.createElement('div')
    name_line.className="block-name"
    name_line.appendChild(remove_button)
    name_line.appendChild(name_field)
    name_line.appendChild(error_field)
    name_line.appendChild(info_btn)
    block.appendChild(name_line)


    var info_box = document.createElement("div")
    info_box.classList = "info-box"
    if (SoE!==undefined){
        info_box.innerHTML = SoE.info    

    }
    block.appendChild(info_box)



    if (SoE!=undefined){
        name_field.value=SoE.name

        var eqns=SoE.eqns
    
        if(!Array.isArray(eqns)){
            eqns=[eqns]
        }
    
    
        for (let j=0;j<eqns.length;j++){
            
            block.appendChild(make_line(eqns[j]))
            
    
        }


 

        if (SoE.info!==undefined){
            info_btn.innerHTML = "info"
            info_btn.classList = "info-btn"
            info_btn.onclick = (e)=>{
                var popup = e.target.parentNode.parentNode.children[1]
                if (popup.style.display==="block"){
                    popup.style.display = "none"
                }else{
                    popup.style.display = "block"
                }
            }
        }



    }else{
        //! not sure if this is ever reached
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












var MQ = MathQuill.getInterface(2);


CURRENT_USER = null

function removeUndefined(obj) {
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (obj[i] === undefined) {
          obj.splice(i, 1);
          i--; // Adjust index after removal
        } else if (typeof obj[i] === 'object') {
          removeUndefined(obj[i]); // Recurse into nested object or array
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (obj[key] === undefined) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          removeUndefined(obj[key]); // Recurse into nested object or array
        }
      }
    }
}
  

var SoEs= [
    {
        name:"System",
        info: "hi",
        eqns: [
        {input: "(a+1)\\cdot a=4"},
        {input: "Box"}

        ]
    },


    {
        name:"Sol",
        eqns: [
        {input: "solve System"},
               
        ]
    }

]

const equation_visuals = []

function clear_equation_visuals(){
    while (equation_visuals.length > 0){
        equation_visuals.pop()
    }
}

function send_sheet(sheet,start_idx,end_idx){
    // start is inclusive, end is exclusive (1 to 2 means just 1)
    if (end_idx<=start_idx){return}
    clear_equation_visuals()
    const new_SoEs = calc(sheet,start_idx,end_idx)
    data2DOM(new_SoEs)
    display_vis(equation_visuals.flat())

}

function run_sheet(){

    var sheet_data=DOM2data()
    

    // fixed inputs for start and end kind of defeats the whole purpose, but it's so fast now, so does it really matter
    send_sheet(sheet_data,0,sheet_data.length)
}



function resetGS(){
    var reached_coord_labels = false
    scene.objects.forEach(obj=>{
        // this code would prevent it from removing the axes:
        /*
        if (obj.constructor.name==="label"){
            reached_coord_labels = true
            return
        }
        if (!reached_coord_labels){return}
        */
        obj.visible=false
    })

}


data2DOM(SoEs)  // performed without calculations
var start_run_idx
var end_run_idx

const scene = setUpGS("vis")

box({size:vec(2,0.5,1)})


document.addEventListener('keyup', (e)=>{
    if (e.code==="Enter"){
        var in_field=document.activeElement
        if (e.ctrlKey){
            // resetGS()
            run_sheet()
        }else if(in_field.tagName=="TEXTAREA"){
            add_line(in_field)
        }else if(in_field.className=="block-name-txt"){
            add_block(in_field)
        }
    }else if(e.code ==="KeyZ" && e.ctrlKey){
        undo()
    }else if(e.code === "KeyY" && e.ctrlKey){
        redo()
    }          
})


const fb_config = {
    apiKey: "AIzaSyBrjMcMVh5Qe4i1wI28Hu6cWtlBLn-1Fpc",
    authDomain: "see-calc-8d690.firebaseapp.com",
    databaseURL: "https://see-calc-8d690-default-rtdb.firebaseio.com",
    projectId: "see-calc-8d690",
    storageBucket: "see-calc-8d690.appspot.com",
    messagingSenderId: "712428414817",
    appId: "1:712428414817:web:13ebddba5db433e5960720",
    measurementId: "G-GP5ZDNCTXX"
};

firebase.initializeApp(fb_config);
const database = firebase.database().ref();

const auth = firebase.auth()

function clear_sheet(){
    $(".calc-row").remove()
    document.body.appendChild(make_block_row())
    window.location.hash = ""

}

//const save_btn = document.getElementById("save-btn")
function save_sheet(){

    // const url = window.location.hash

    

    // const path_list = url.replaceAll("#","").split(".")

    // const folder_path = path_list.slice(0,path_list.length-1).join("/")


    const sheet_name = document.getElementById("save-field").value


    // const sheet_name_target = all_names.join(".").replaceAll(" ","-")


    
    const is_alphanumeric =  /^[a-zA-Z0-9\s]+$/.test(sheet_name)

    if (!is_alphanumeric){
        alert("sheet name must only contain letters and numbers") 
        return
    }


    write_url(CURRENT_USER, [sheet_name])


    const blocks = JSON.parse(JSON.stringify((DOM2data())))
    const solved_blocks = calc(blocks,0,blocks.length)

    
    const sanitized_solved_blocks = replace_errors_with_messages(solved_blocks)
    

    const sheet_data = {name: sheet_name, blocks: sanitized_solved_blocks, visuals: equation_visuals}
    

    //! for now always saving into top folder
    // save_content(firebase_data, "", sheet_data, true)
    
    save_content(get_firebase_data(CURRENT_USER), "", sheet_data, true)

    // delete_content(firebase_data,dir, old_sheet_name)
    // save_content(firebase_data, folder_path, sheet_data, true)

    // window.location.hash = full_path
    // send_to_url()

    database.set(firebase_data)    
}


function log_in(){
    // TODO check if already account
        // need to figure out registering vs logging in 


    
    const logged_in_user = document.getElementById("username").value

    const is_alphanumeric =  /^[a-zA-Z0-9\s]+$/.test(logged_in_user)

    if (!is_alphanumeric){
        alert("username must only contain letters and numbers") 
        return
    }


    CURRENT_USER = logged_in_user

    const all_users = Object.keys(firebase_data.Users)

    const already_a_user = all_users.some(user => {return user == logged_in_user})

    if (!already_a_user){
        firebase_data.Users[logged_in_user] = ["blank"] // cause stupid firebase doesn't understand empty arrays
    }



    document.getElementById("logged_in").style.display = "block";
    document.getElementById("logged_out").style.display = "none";

    update_library()

}

function log_out(){
    CURRENT_USER = null

    
    document.getElementById("logged_out").style.display = "block";
    document.getElementById("logged_in").style.display = "none";

    update_library()
}

let firebase_data

function get_firebase_data(owner){
    if (owner){
        return firebase_data.Users[owner]
    }else{
        return firebase_data.Library
    }
}


database.on("value", update_library,(e)=>{throw e});

function update_library(package = null){

    if (package !== null){
        const data = package.val()
        firebase_data = data //Object.values(data)  
        send_to_url()
  
    }
    
    const load_btns = [...document.getElementsByClassName("sheet-load-btn")]
    load_btns.forEach((btn)=>{btn.remove()})

    const library_root = document.getElementById("library")
    const user_content_root = document.getElementById("user-content")


    // const library_data = firebase_data.filter(entry => {return !entry.owner})
    // const user_data = firebase_data.filter(entry => {return entry.owner === CURRENT_USER})


    const create_library_buttons = (names, container)=>{create_sheet_buttons(names, container, null)}
    const create_user_buttons = (names, container)=>{create_sheet_buttons(names, container, CURRENT_USER)}

    let user_data
    if (!firebase_data.Users || !firebase_data.Users[CURRENT_USER]){
        user_data = []
    }else{
        user_data = firebase_data.Users[CURRENT_USER]
    }

    replace_UI_tree(firebase_data.Library, library_root, create_library_buttons)
    replace_UI_tree(user_data, user_content_root, create_user_buttons)

    
}

test_folder_name = "Tests"

function add_to_test(sheet_names){

    sheet_names.forEach(name => {
        move_content(firebase_data.Library, "",test_folder_name, name)
    })    
}


function write_url(owner, path_split){

    //URL add folder, need to join with periods

    let username_path
    if (owner){
        username_path = `${owner}|`
    }else{
        username_path = ""
    }
    const target = `${username_path}${path_split.join(".").replaceAll(" ","-")}`

    window.location.hash = target;

}

function send_to_url(){

    const target = window.location.hash.substring(1);
    if (!target) {return}
    const stuff = target.split("|")

    let owner, content_target
    if (stuff.length === 1){
        owner = null
        content_target = stuff[0]
    }else if (stuff.length === 2){
        owner = stuff[0]
        content_target = stuff[1]
    }else{
        throw "should only have one pipe in the url"
    }
    const split_path = content_target.replaceAll("-"," ").split(".")
    load_sheet(split_path, owner);
    


}



window.addEventListener('hashchange', send_to_url);


function create_unknown_page(){
    $("#page-not-found")[0].style.display = "block"
    document.body.style.display = "none"
}

function load_sheet(all_names, owner){

    const sheet_name = all_names[all_names. length-1]
    
    const path = all_names.slice(0,all_names.length-1).join("/") 


    let folder_content
    try{
        folder_content = get_folder_content(path, get_firebase_data(owner))
    }catch (e){
        if (typeof e === "string"){
            create_unknown_page()
            return
        }else{
            throw e
        }
    }

    const possible_sheets = folder_content.filter(sheet => {


        const is_sheet = !sheet.children

        const is_correct_name = sheet.name === sheet_name

        // second check is since old sheets in the library could be undefined instead of null
        // one undefined and the other null should also match
        // const is_correct_owner = (sheet.owner === owner) || (!sheet.owner && !owner)
        
        return is_sheet && is_correct_name // && is_correct_owner
    })

    if (possible_sheets.length === 0){
        create_unknown_page()
        return
    }

    if (possible_sheets.length > 1){
        throw "check whats going on, there should only be one sheet"
    }

    const sheet_visuals = possible_sheets[0].visuals
    
    const sanitized_sheet_data = possible_sheets[0].blocks

    const sheet_data = replace_messages_with_errors(sanitized_sheet_data)



    resetGS()    

    document.getElementById("save-field").value=sheet_name
    // TODO right now im never setting loaded
    if (document.body.loaded){
        throw "should never reach this point"
        send_sheet(sheet_data,0,sheet_data.length)
    }else{
        //! will not produce a visual right now (would have to run compute_sheet first to get the vis equations), then call use_calc_results
        data2DOM(sheet_data)

        if (sheet_visuals !== undefined){
            // checking if undefined just cause of stuff i saved before adding the visuals attribute
            // getting dictionary values cause of stupid firebase ):<
            display_vis(Object.values(sheet_visuals).flat())
        }
        
    }


}


function create_sheet_buttons(all_names, container, owner){


    const library_btn_class = "library-load-btn"
    const sel_class = "library-load-btn-sel"

    const sheet_name = all_names[all_names.length-1]

    const load_btn = document.createElement("button")
    load_btn.classList.add(library_btn_class)

    load_btn.innerText = sheet_name

    load_btn.onclick=()=>{
        // writing the url will automatically update the sheet
        write_url(owner, all_names)

        

        const prev_sel_btns = document.getElementsByClassName(sel_class)


        if (prev_sel_btns.length > 1){
            throw "only one should be selected"
        }

        if (prev_sel_btns.length === 1){
            const prev_sel_btn = prev_sel_btns[0]
            prev_sel_btn.classList.remove(sel_class)
            prev_sel_btn.classList.add(library_btn_class)
        }
        
        load_btn.classList.remove(library_btn_class)
        load_btn.classList.add(sel_class)

        
    }

    
    const delete_btn = document.createElement("button")

    delete_btn.classList.add("add-remove-btn")
    delete_btn.classList.add("ibrary-delete-btn")
    delete_btn.innerText = "X"

    const really_delete_btn = document.createElement('button')
    really_delete_btn.innerText = `Delete ${sheet_name}`
    const cancel_delete_btn = document.createElement('button')
    cancel_delete_btn.innerText = `Cancel`
    
    really_delete_btn.className = 'check-delete-btn'
    cancel_delete_btn.style.backgroundColor = 'white'
    cancel_delete_btn.style.border = 'none'
    cancel_delete_btn.style.fontWeight = 'bold'
    cancel_delete_btn.style.cursor = 'pointer'
    cancel_delete_btn.style.color = 'green'
    
    // cancel_delete_btn.className = 'check-delete-btn'
    // cancel_delete_btn.style.backgroundColor = 'green'


    really_delete_btn.style.display = 'none'
    cancel_delete_btn.style.display = 'none'


    delete_btn.onclick=()=>{

        load_btn.style.display = 'none'
        delete_btn.style.display = 'none'

        really_delete_btn.style.display = ''
        cancel_delete_btn.style.display = ''
    }

    really_delete_btn.onclick=()=>{


        if (sheet_name === window.location.hash.replace("#","")){
            window.location.hash = ""
        }

        const all_dir_names = JSON.parse(JSON.stringify(all_names))

        all_dir_names.pop()

        const path = all_dir_names.join("/")

        delete_content(get_firebase_data(owner), path,sheet_name)
        database.set(firebase_data)
        
    }

    cancel_delete_btn.onclick = ()=>{
        load_btn.style.display = ''
        delete_btn.style.display = ''
        really_delete_btn.style.display = 'none'
        cancel_delete_btn.style.display = 'none'
    }


    container.appendChild(delete_btn)

    container.appendChild(cancel_delete_btn)
    container.appendChild(really_delete_btn)

    container.appendChild(load_btn)
};



function package_firebase(sheets){
    
    // just a temporary function to get things set up
    const new_sheets = Object.keys(sheets).map(sheet_name => {
        const sheet_content = sheets[sheet_name]
        return {name: sheet_name, blocks: sheet_content}
    })

    console.log(JSON.stringify(new_sheets))

    download(JSON.stringify(new_sheets),"boop.json","text/plain")
}

function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

function change_start_idx(idx){

    end_run_idx = $(".block").length

    if (start_run_idx===undefined){ // initially set
        start_run_idx = idx
    }else{
        start_run_idx = min(start_run_idx,idx)
    }

}


function DOM2data(){
    var data=[]

    var SoE_boxes = document.getElementsByClassName('block')
    var name_fields = document.getElementsByClassName('block-name-txt')
    var info_blocks = document.getElementsByClassName('info-box')

    var SoE_boxes = $(".block")
    var name_fields = $('.block-name-txt')
    var info_blocks = $('.info-box')

    SoE_boxes.each(function(block_i){
        var block = $(this)
        var name_field = name_fields[block_i].value
        var info = info_blocks[block_i].innerHTML

        data[block_i] = {}
        data[block_i].name = name_field
        data[block_i].show_box = block.children(".line")[0].style.display


        if (info!=="undefined" && info!==""){
            data[block_i].info=info
        }

        data[block_i].eqns = []
        
        var lines = block.find(".line")
        lines.each(function(line_i){
            var eqn_row = $(this)
            data[block_i].display = ""
            const input_raw =MQ(eqn_row.find(".line-input")[0]).latex()
            var input = add_char_placeholders(input_raw)
            if (input===""){return}

            var sub_table = eqn_row.find(".sub-table")[0]

            var eqn_info = {}
            var line_output = $(eqn_row).find(".line-output")[0]

            const is_solve_line = input.includes("\\operatorname{solve}")

            if (line_output===undefined){
                if (is_solve_line){
                    var show_output = "block"
                }else{
                    var show_output = "none"
                }
            }else{
                var show_output = line_output.style.display
            }


            eqn_info.show_output = show_output
            eqn_info.input=input

            // firebase sometimes doesn't like when undefined is a value
            
            const sub_data = get_sub_data(sub_table)

            if (sub_data!==undefined){
                eqn_info.sub_table = sub_data
            }
            //eqn_info.sub_table = get_sub_data(sub_table)

            data[block_i].eqns.push(eqn_info)

        })

        // keeps a single blank line
        if (data[block_i].eqns.length === 0){
            data[block_i].eqns.push({input:"",show_output:true})
        }
    })

    return data
} 

function data2DOM(SoEs){

    $(".calc-row").remove()

    
    console.log(`number of fields: ${[...$(".eqn-field")].length}`)

    const main = document.body

    for (let i=0;i<SoEs.length;i++){
 
        var row = make_block_row(SoEs[i])

        if (SoEs[i].show_box == "none"){
            lines = [...row.querySelectorAll(".line")]
            lines.forEach((line)=>{line.style.display = "none"})
            display_btn = [...row.querySelectorAll(".info-btn")].at(-1) // last element
            var arr = $(row).find(".collapse-down")[0]
            arr.classList.remove("collapse-down")
            arr.classList.add("collapse-right")
        }
        main.appendChild(row)
    }

    start_run_idx = end_run_idx
    end_run_idx = SoEs.length

    make_MQ()
}


function show_steps(steps_all_eqns){


    // clear the solve steps from the previous step
    $("#solve-steps")[0].innerHTML = ""
    
    // called by data2DOM directly instead

    if (steps_all_eqns === undefined || steps_all_eqns.length === 0){
        return
    }

    const steps = steps_all_eqns[0] // for now just showing steps for the first one


    // stupid firebase removes empty arrays D:
    if (steps.forward === undefined){
        steps.forward = []
    }

    if (steps.back === undefined){
        steps.back = []
    }

    const all_lines = []
    
    function sp(n){
        let txt = ""
        for (let i=0;i<n;i++){
            txt = txt+"\\ "
        }
        return txt
    }
    
    const arrow = " \\ \\  \\Rightarrow \\ \\ "



    steps.back.forEach(step => {

        const line = `\\text{Solving} ${sp(2)} ${step.eqn0} ${sp(2)}\\text{for} ${sp(2)} ${step.solve_var} ${arrow} ${step.solve_var} = ${step.sol}`

        all_lines.push(line)
    
        // same issue with firebase ):<
        if (step.substitutions === undefined){
            step.substitutions = []
        }

        step.substitutions.forEach(sub => {
            const sub_line = `${sp(4)} \\text{Subbing} ${sp(2)} ${sub.eqn0} ${arrow} ${sub.eqn_subbed}`
            
            all_lines.push(sub_line)
        
        })
    

        
    })


    steps.forward.forEach(step => {
        


        const line =  `\\text{Evaluating} ${sp(2)} ${step.eqn} ${arrow} ${step.sol}`

        all_lines.push(line)


    })




    const container = $("#solve-steps")[0]

    all_lines.forEach(line => {

        container.appendChild(wrap_static_MQ(line, false))

    })



    
}




function add_line(in_field){

    var line=$(in_field).parents(".line")
    var block=$(in_field).parents(".block")

    var next_line = line.next()[0]
    var new_line=make_line()
    var block_dom = block[0]

    block_dom.insertBefore(new_line,next_line)
    MQ($(new_line).children(".line-input")[0]).focus()
}


function make_line(eqn){

    var line=document.createElement('div')
    line.className = "line"
    var add_btn = document.createElement("button")
    add_btn.innerText = "+"
    add_btn.onclick = (e)=>{
        add_line(e.target)}

    add_btn.classList.add("add-remove-btn")
    add_btn.classList.add("add-line-btn")
    add_btn.appendChild(make_tooltip())

    var remove_button=document.createElement('button')
    remove_button.innerText="X"
    remove_button.onclick=function(event){
        var button=event.target
        var line = $(button).parents(".line")
        var outer = line.parent()
        var n_lines = outer.children(".line").length
        change_start_idx($(button).parents(".calc-row").index())

        outer[0].removeChild(line[0])
        if (n_lines===1){
            outer[0].appendChild(make_line())
        }  
    }
    
    remove_button.className="line-btn"  // i dont think this is used
    remove_button.classList.add("add-remove-btn")
    remove_button.classList.add("remove-line-btn")
    remove_button.appendChild(make_tooltip())

    var in_field=document.createElement('div')
    in_field.classList.add("line-input")
    in_field.classList.add("MQ-input")
    
    const trig_names = "sin cos tan csc sec cot sinh cosh tanh csch sech coth arcsin arccos arctan arccsc arcsec arccot arcsinh arccosh arctanh arccsch arcsech arccoth"

    const text_convert = combine_with_space(["solve",trig_names])

    function combine_with_space(strings){
        let combined = ""
        strings.forEach(string=>{
            combined+=string
            combined+=" "

        })
        combined = combined.slice(0,-1)

        return combined
    }
    //MQ
    MQ.MathField(in_field, {
        //autoCommands: "sqrt", // to just type instead of backslash
        autoOperatorNames: text_convert,
        handlers: {edit: function() {

        // i update it before appending it to the document when textifying solve
        if($(in_field).parents("#calc").length===0){return}


        // for some reason, MQ runs it on creation, before there are parent elements ):<
        if(in_field.parentElement===null){
            return 
        }

        
        in_field.classList.remove(".input-error")

        var calc_row = in_field.parentElement.parentElement.parentElement
        var idx = [].indexOf.call(calc_row.parentNode.children, calc_row);       
        change_start_idx(idx)

        var row = $(in_field).parents(".line")


        var remove_classes = [".collapse-arrow",".error-msg",".display-eqn-cell"]//,".sub-table"]

        remove_classes.forEach((cl)=>{
            var item = row.find(cl)[0]
            if (item===undefined){return}
            item.style.display = "none"
        })

    }}})   // editing it should change the start_idx for solving





    var out_field=document.createElement('span')


    

    var sub_table
    var output_arr = document.createElement("div")


    if (eqn === undefined){eqn = {input:""}}


    var input = eqn.input
    input = input.replaceAll("\\ ","")

    in_field.temp_ltx = remove_char_placeholders(input) // just to store it temporarily cause mq is annoying about 
    //MQ(in_field).latex(input)
    var display_eqns = eqn.result
    var show_output = eqn.show_output

    if (show_output === undefined){
        show_output = ""
    }
    

    const is_solve_line = eqn.input.includes("\\operatorname{solve}")

    const is_error = display_eqns instanceof Error


    // Trying to not have the output arrows if there's an error for tabular solve
    // not doing that for now though:

    // const has_tabular_error = Array.isArray(eqn) && display_eqns.some(eqn => {return eqn.error instanceof Error})
    // const has_error = is_error || has_tabular_error

    if(display_eqns === undefined){
        out_field.innerHTML = ""
        show_output = "block"
    }else if (is_error){
        out_field.innerHTML = display_eqns  // this occurs only when it's an error or new line
        out_field.classList.add("error-msg")
        in_field.classList.add("input-error")
        show_output = "block"

    }else{
        out_field.classList.add("line-output")
        output_arr.classList.add("collapse-arrow","collapse-right")
        output_arr.onclick = ()=>{
            if (out_field.style.display==="block"){
                out_field.style.display = "none"
                output_arr.classList.remove("collapse-left")
                output_arr.classList.add("collapse-right")

            }else{
                out_field.style.display = "block"
                output_arr.classList.remove("collapse-right")
                output_arr.classList.add("collapse-left")

            }
        }

        // it will always create a table, even for single output
        // if it's not result of a sub_table it returns an array (not nested), so I need to nest it first
        if (typeof display_eqns[0]==="string"){display_eqns = [display_eqns]}

        var table = document.createElement("table")
        var row = document.createElement("tr")
        row.innerText = " "
        table.appendChild(row)
        display_eqns.forEach(arr_row=>{
            
            var row = document.createElement("tr")
            if (arr_row.error instanceof Error){row.innerText = arr_row.error.message}
            else if(is_solve_line){
                row.innerText = ""
            }else{
                arr_row.forEach(eqn=>{
                    eqn = format_visual_eqn(eqn)
                    const eqn_wrapper = wrap_static_MQ(eqn)
                    row.appendChild(eqn_wrapper)
    
                })
                
            }
            table.appendChild(row)

        })
        out_field.appendChild(table)
    }

    /*
    let solve_result
    if (is_solve_line){
        solve_result = eqn.result
    }else{
        solve_result = [[]]
    }
    */
    sub_table = make_sub_table(eqn.sub_table, eqn.result, is_solve_line)

    
    out_field.style.display = show_output
    
    if (show_output==="none"  || show_output===""){  
        output_arr.classList.remove("collapse-left")
        output_arr.classList.add("collapse-right")
    }else if (show_output==="block"){
        output_arr.classList.add("collapse-left")
        output_arr.classList.remove("collapse-right")
    }else{
        throw "Neither??"
    }
    

    line.appendChild(remove_button)
    line.appendChild(add_btn)
    line.appendChild(in_field)
    line.appendChild(sub_table)

    if (true){
        line.appendChild(output_arr)
        line.appendChild(out_field)    
    }
    
    //! for now just showing steps for first one
    show_steps(eqn.solve_steps)

    return line


}

function format_visual_eqn(eqn){
    const parts = eqn.split("|VISUAL")
    if (parts.length === 1){
        return eqn
    }else if(parts.length > 2){
        throw "should only be split once"
    }
    const values = parts[0].split("|")
    const visual_name = parts[1]
    const visuals = vis_blocks.filter(block =>{ return block.name === visual_name} )

    if (visuals.length !== 1){
        throw "should be one match"
    }

    const visual = visuals[0]

    const visual_vars = Object.keys(visual.vars)

    if (values.length !== visual_vars.length){
        throw "should be same number of variables and subbed values"
    }

    const n_vars = visual_vars.length

    let new_text = visual_name+"("

    let i = 0 // cause js doesn't have range ):<
    while(i<n_vars){
        new_text += `${visual_vars[i]}=${values[i]},`
        i++
    }   

    new_text = new_text.slice(0,-1)+")"

    return new_text
}

function round_decimals(expression, n_places) {

    //const regex = /[0-9]\.[0-9]+/g
    const regex = /\d*\.\d*/g
    return expression.replace(regex, match => {
        const roundedNumber = parseFloat(match).toFixed(n_places)
        return parseFloat(roundedNumber).toString()
    });
}


function make_block_row(SoE){
    //! im not creating a load bar any more so i should just make_block directly
    // this is the row of blocks
    // it contains the block and part of the load bar
    var row = document.createElement("div")
    row.classList.add("calc-row")
    row.appendChild(make_block(SoE))

    return row

}

function add_block(field){
    // called both by the button to add a block and by pressing Enter
    // field could either be the X button or the input field
    var block=field.parentNode.parentNode
    var block_row = block.parentNode
    var main = block_row.parentNode
    var next_row=block_row.nextElementSibling
    var new_row=make_block_row()
    main.insertBefore(new_row,next_row)
    //$(new_row).find(".line-input")[0].focus()


        

    var idx = [].indexOf.call(new_row.parentNode.children, new_row)+1;
    change_start_idx(idx)
}

function make_block(SoE){

    var block=document.createElement('div')

    block.className="block"

    var remove_button=document.createElement('button')
    remove_button.onclick=function(event){
        var button=event.target
        var row=button.parentNode.parentNode.parentNode
        var outer=row.parentNode

        if (outer.children.length>1){ // one for the name and one for the remaining line
            var prev_row = row.previousSibling
            change_start_idx([].indexOf.call(row.parentNode.children, row) )

            outer.removeChild(row)
        }
    }
    remove_button.innerHTML="X"
    remove_button.className="block-remove"
    remove_button.classList.add("add-remove-btn")
    remove_button.classList.add("remove-block-btn")
    remove_button.appendChild(make_tooltip())

    var add_btn = document.createElement("button")
    add_btn.onclick = (e) => {
        add_block(e.target)
    }
    add_btn.innerHTML = "+"
    add_btn.classList.add("add-remove-btn")
    add_btn.classList.add("add-block-btn")
    add_btn.appendChild(make_tooltip())

    var info_btn = document.createElement("button")
    info_btn.classList = "empty-info-btn"

    var close_btn = document.createElement("button")
    close_btn.classList = "collapse-arrow collapse-down"
    close_btn.style.top = "-5px"


    var name_field=document.createElement('input')
    name_field.spellcheck = false
    name_field.classList.add("block-name-txt")
    name_field.oninput = (e)=>{
        name_field.classList.remove("input-error")
        $(name_field).parents(".block").find(".block-error-msg")[0].style.display = "none"
        var row = e.target.parentElement.parentElement.parentElement
        change_start_idx([].indexOf.call(row.parentNode.children, row))
    }
    
    var error_field = document.createElement('span')
    error_field.classList.add("block-error-msg")    // right now just for finding it so it can be removed on edit (no style)


    if (SoE!==undefined && SoE.result instanceof Error){
        error_field.innerText = SoE.result.message
        error_field.style.display = ""
        name_field.classList.add("input-error")

    }



    //block.appendChild(error_field)

    name_line=document.createElement('span')
    name_line.className="block-name"
    name_line.appendChild(close_btn)
    
    name_line.appendChild(add_btn)
    name_line.appendChild(remove_button)
    
    name_line.appendChild(name_field)

    name_line.appendChild(error_field)

    //name_line.appendChild(info_btn)

    block.appendChild(name_line)


    var info_box = document.createElement("div")
    info_box.classList = "info-box"
    if (SoE!==undefined){
        info_box.innerHTML = SoE.info    

    }


    block.appendChild(info_box)

    close_btn.onclick = (e)=>{
        var block = e.target.parentNode.parentNode
        const lines = [...block.getElementsByClassName("line")]
        const display = lines[0].style.display
        if (display === "none"){
            e.target.classList.remove("collapse-right")
            e.target.classList.add("collapse-down")
            var new_display = ""
        }else{
            e.target.classList.add("collapse-right")
            e.target.classList.remove("collapse-down")
            var new_display = "none"
        }
        lines.forEach((line)=>{line.style.display = new_display})



    }

    if (SoE!=undefined){
        name_field.value=SoE.name

        var eqns=SoE.eqns
    
        if(!Array.isArray(eqns)){
            eqns=[eqns]
        }
    
    
        for (let j=0;j<eqns.length;j++){
            var line = make_line(eqns[j])


            block.appendChild(line)

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
      //  console.error("SHOULD NOT BE REACHED")
        block.appendChild(make_line())
    }

    const lines = [...block.getElementsByClassName("line")]

    //if (SoE.display===undefined){SoE.display = "block"}

    //lines.forEach((line)=>{line.style.display = SoE.display})

    return block


}


function getParentCell(root){
	div = root
	while(div.tagName!=="TD"){
		div = div.parentElement
	}
	return div
}

function getDeepestDivs(root){

	// gets the deepest divs, used to find character spans in mathquill 
	var inner = []
	getInner(root)
	function getInner(div){
		children = [...div.children]

		children.forEach(child=>{
			if (child.children.length==0){
				inner.push(child)
			}else{
				getInner(child)
			}
		})
	}
	return inner
}

// when i was trying to color individual variables, not used righ
function unhighlight(){
	var in_fields = [...document.getElementsByClassName("sub-input")]

	in_fields.forEach(field=>{
		getDeepestDivs(field).forEach(div=>{
			div.style.color = "black"
		})
	})
}

function getIndicesOf(searchStr, str) {
	var searchStrLen = searchStr.length;
	if (searchStrLen == 0) {
        return [];
    }
    var startIndex = 0, index, indices = [];

    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}


function replace_errors_with_messages(obj) {

    // used for saving to firebase, since it can't save errors
    if (obj instanceof Error) {
        return obj.message;
    } else if (Array.isArray(obj)) {
        return obj.map(replace_errors_with_messages);
    } else if (obj !== null && typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                result[key] = replace_errors_with_messages(obj[key]);
            }
        }
        return result;
    }
    return obj;
}

function replace_messages_with_errors(obj) {

    // used for saving to firebase, since it can't save errors
    if (Array.isArray(obj)) {
        return obj.map(replace_messages_with_errors);
    } else if (obj !== null && typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
            if (!obj.hasOwnProperty(key)) {continue}
            
            if (key === 'error'){
                if (typeof obj[key] !== 'string'){
                    throw "errors should always be saved as strings in firebase"
                }
                result[key] = new Error(obj[key])
            }else{
                result[key] = replace_messages_with_errors(obj[key])
            }
        }
        return result;
    }
    return obj;
}

  



function make_sub_table(table_data, solve_result, is_solve_line){


    
    var table = document.createElement("table")

    let base_vars

    if (table_data!==undefined && table_data.length!==0){
        base_vars = table_data[0]

        for (let i=0;i<table_data.length;i++){

            let solve_output_eqns

            const editable = i!==0

            //! should only be an array containing an error now
            const contains_error = editable &&solve_result!== undefined && solve_result[i-1].error !== undefined
            if (i===0 || contains_error || !is_solve_line){
                solve_output_eqns = []
            }else{
                solve_output_eqns = solve_result[i-1]
            }

            let blank_idxs
            if (contains_error){
                blank_idxs = solve_result[i-1].output_idxs
            }else{
                blank_idxs = []
            }
            
            const fuck_firebase = blank_idxs === undefined
            if (fuck_firebase){
                blank_idxs = []
            }

            const new_row = make_row(table_data[i],editable,solve_output_eqns,blank_idxs)

            if (contains_error){
                //const cells = [...new_row.children]
                //cells.pop()
                //cells.forEach(cell => {cell.style.outline="solid green"})
                new_row.style.outline="thin solid red"
                //new_row.classList.add("input-error")
            }
			table.appendChild(new_row)
        }
    

        table.className = "sub-table"
    
    
    }
    
    if (table_data==undefined){
        table.style.display = "none"
    }

    table.classList.add(".sub-table")
    return table

    function make_row(vars,not_first_row,solve_output_eqns,blank_idxs){


        const solve_output = {}

        solve_output_eqns.forEach(eqn => {
            const stuff = eqn.split("=")
            const solve_var = stuff[0]
            const solve_val = stuff[1]
            solve_output[solve_var] = solve_val
        })


    	var row = document.createElement("tr")
    	vars.forEach((cell_val,idx)=>{

            // const ltx_exp = math_to_ltx(var_name)

            // maybe just keep the backslash instead

            let in_field = document.createElement("div")

            const base_var = base_vars[idx]

            let is_output = false

            if (Object.keys(solve_output).includes(base_var)){


                cell_val = solve_output[base_var]
                is_output = true

            }

            // cause double negatives are great :)
            if (!not_first_row || is_output){
                MQ.StaticMath(in_field)
                
            }else{

            
                //MQ
                MQ.MathField(in_field, {handlers: {edit: function() {
                    if(in_field.parentElement===null){
                        return 
                    }
                    change_start_idx($(in_field).parents(".calc-row").index())

                }}})

            }
            
            if (!blank_idxs.includes(idx)){
                // round_decimals is actually overkill
                    // that rounds all numbers in an expression
                    // i only need to round a single number
                const rounded_cell_val = remove_char_placeholders( round_decimals(cell_val, 3))
                MQ(in_field).latex(rounded_cell_val)
            }
           



            var cell = document.createElement("td")
            in_field.style.width = "50px"
            cell.appendChild(in_field)
            row.appendChild(cell)


		})
		if (not_first_row){
			row.appendChild(make_row_ops())
		}else{
			row.classList.add("top-row")
		}
		return row

		function make_row_ops(){  // should take idx as input?
			var ops = document.createElement("span")

			var add = document.createElement("button")
            add.classList.add("table-add")
			add.innerText="+"
			add.onclick = (e)=>{
                let new_vars
                if (is_solve_line){
                    const blank = [];base_vars.forEach(()=>{blank.push("")})

                    new_vars = blank
                }else{
                    new_vars = base_vars
                }
				table.insertBefore(make_row(new_vars,true,[],[]),row.nextSibling)
                change_start_idx($(e.target).parents(".calc-row").index())

			}


			var remove = document.createElement("button")
            remove.classList.add("table-remove")
			remove.innerText = "X"
			remove.onclick = (e)=>{
                change_start_idx($(e.target).parents(".calc-row").index())

				if(table.childElementCount>2){
					row.remove()
				}
			}

			var clear = document.createElement("button")
            clear.classList.add("table-clear")
			clear.innerText="-"
			clear.onclick = (e)=>{
                change_start_idx($(e.target).parents(".calc-row").index())

				var blank = [];base_vars.forEach(()=>{blank.push("")})

				table.insertBefore(make_row(blank,true,[],[]),row.nextSibling)
				
				row.remove()

			}

			[add,remove,clear].forEach((btn)=>{
                btn.appendChild(make_tooltip())
				ops.appendChild(btn)
                ops.style.whiteSpace = "nowrap"
				btn.classList.add("sub-table-btn")


			})

        


			return ops
		}
		
    }

	
}





// will be called in DOM2data
function get_sub_data(table){
    const output_solve_idxs = []
    if (table===undefined){return} // if it's just a placeholder, returns undefined, which is checked in the function call
    
    var data = []
    var rows = table.children

    if (rows.length === 0){return}

    // array with each element representing a row of substitutions, each in that representing a substitution, and a 2 element array in that with the input and output
    for (let i=0;i<rows.length;i++){
        var row = rows[i]
        var cells = row.children
        data.push([])
        for (let j=0;j<cells.length;j++){
            var cell = cells[j]
            var mq_field = cell.children[0]
            if(!(mq_field.className.includes("mq"))){continue}
            const ltx_raw = MQ(mq_field).latex()
            var ltx = add_char_placeholders(ltx_raw)
            data[i].push(ltx)

            if (i>0 && !([...mq_field.classList].includes("mq-editable-field"))){
                output_solve_idxs.push([i,j])
            }
        }
    }
    return {data:data,output_solve_idxs:output_solve_idxs}

}



function setUpGS(id){
    function removeAllChildNodes(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }
    removeAllChildNodes(document.getElementById(id))
    
    
    var graphDiv = document.getElementById(id)
    window.__context= {glowscript_container: graphDiv}  
    let scene=canvas({width: graphDiv.offsetWidth,height: graphDiv.offsetHeight,resizable: true,userzoom: true,autoscale: true})
    //scene.forward=vec(1,-0.5,-1)

    return scene
}


const zoom_factor = 4/5

function zoom_in(){
    scene.range = zoom_factor*scene.range
}


function zoom_out(){
    scene.range = 1/zoom_factor*scene.range
}

function ortho_xy(){
    scene.forward = vec(0,0,-1)
}






function makeCoordShape(coordShapePos=vec(0,0,0),coordShapeScale=1){
    
    var coordTextGap=.1

    var xDir=arrow({axis:vec(1,0,0).multiply(coordShapeScale),pos:coordShapePos})
    var yDir=arrow({axis:vec(0,1,0).multiply(coordShapeScale),pos:coordShapePos})
    var zDir=arrow({axis:vec(0,0,1).multiply(coordShapeScale),pos:coordShapePos})


    var xText=label({text:"x",pos:vec(1+coordTextGap,0,0).multiply(coordShapeScale).add(coordShapePos), box: false, opacity: 0})
    var yText=label({text:"y",pos:vec(0,1+coordTextGap,0).multiply(coordShapeScale).add(coordShapePos), box: false, opacity: 0})
    var zText=label({text:"z",pos:vec(0,0,1+coordTextGap).multiply(coordShapeScale).add(coordShapePos), box: false, opacity: 0})

    var coordShape=[xDir,yDir,zDir,xText,yText,zText]
    
    return coordShape

}

function make_tooltip(){
    var tooltip = document.createElement("div")
    tooltip.classList.add("tooltip")
    return tooltip
}

function wrap_static_MQ(eqn, in_table = true){

    let eqn_wrapper

    if (in_table){
        eqn_wrapper = document.createElement("td") // needed since MQ turns the div into a span
    }else{
        eqn_wrapper = document.createElement("div")
    }

    eqn_wrapper.classList.add("display-eqn-cell")
    var eqn_field = document.createElement("div")
    eqn_field.innerHTML = remove_char_placeholders(round_decimals(eqn, 5))
    eqn_field.className = "eqn-field"    // this is done to mathquillify at the end (must be done after appending it to document so parentheses format isnt messed up)
    
    eqn_wrapper.appendChild(eqn_field)

    return eqn_wrapper
}

function make_MQ(){



    const out_fields = [...$(".eqn-field")]

    out_fields.forEach(field=>{

        // if the mq field is hidden when it's mqilified, parentheses don't show up
        // so i have all its parents displayed as blocks, store the original display, and revert it back after
        
        const outer_fields = [...$(field).parents()]

        const outer_style = []
        outer_fields.forEach(field=>{
            outer_style.push(field.style.display)
            field.style.display = "block"
        })

        field.innerText = field.innerText
        MQ.StaticMath(field)

        outer_fields.forEach((field,idx)=>{
            field.style.display = outer_style[idx]
        })

    })


    const in_fields = [...$(".line-input")]

    in_fields.forEach(field => {

        let ltx = field.temp_ltx
        MQ(field).latex(ltx)
    })

}


var hist_doms = [DOM2data()]
var hist_idx = 0

max_hist = 10

// ill just save the data instead of DOMs (adding doms messes up mq focus fields for some reason)

function undo(){
    var past_dom = hist_doms[hist_idx-1]

    if (past_dom===undefined){return}
    //  in reality would be a callback
    data2DOM(past_dom)

    hist_idx-=1
    //document.body.appendChild(past_dom[0])
}

function redo(){
    var future_dom = hist_doms[hist_idx+1]

    if (future_dom===undefined){return}
    //  in reality would be a callback
    data2DOM(future_dom)

    hist_idx+=1
}


document.addEventListener('keyup', (e)=>{
    // every key stroke it updates the variable tracker and untextifies input keywords

    //track_dom()
    function track_dom(){

        var current_dom = DOM2data()
    
        var past_dom = hist_doms[hist_idx]



        if (JSON.stringify(current_dom)!==JSON.stringify(past_dom)){
            hist_idx+=1
            hist_doms = hist_doms.slice(0,hist_idx)
            hist_doms.push(current_dom)
        }



    }


    //search_for_vars()

    // dont update if it's not in a line input

    // TODO none of this should be needed
    var input_fields = $(e.target).parents(".line-input")
    if(input_fields.length===0){return}

    var input_field = MQ(input_fields[0])
    var input = input_field.latex()

    var output = strip_text(input)

    if (input!==output){
        input_field.latex(output)
    }
})


function strip_text(input){  
    var output
    if (input.includes("\\text{")){
        var slice_idx = (input.lastIndexOf("}"))-input.length
        output = input.replace("\\text{","").slice(0,slice_idx)
    }else{
        output = input
    }
    return output
}




function search_for_vars(){

    // find which button has been selected
    var search_block_style = [...$(".search-block-btn")]
    for (var block_sel_idx = 0;block_sel_idx<search_block_style.length;block_sel_idx++){
        if ([...search_block_style[block_sel_idx].classList].includes("search-sel")){
            break
        }
    }

    
    


    $("#search-block").html("")


    var mapped_fields = map_all_vars()

    var block_names = Object.keys(mapped_fields)

    block_names.forEach(name=>{
        var name_btn = document.createElement("button")
        name_btn.classList.add("search-block-btn")      // for identification
        name_btn.classList.add("search-btn")            // for style
        name_btn.innerText = name
        name_btn.onclick = (e)=>{add_search_vars(e.target)}
        $("#search-block")[0].appendChild(name_btn)

    })


    /*
    would want it to move to the focused math but it doesnt matter much

    var focused_idx = $(".mq-focus").parents(".calc-block-row").index()
    if(focused_idx===-1){focused_idx=0}
    */
    if ($(".search-block-btn").length>=block_sel_idx){
        block_sel_idx = 0
    }

    add_search_vars($(".search-block-btn")[block_sel_idx])



    function add_search_vars(block_btn){

        $(".mq-editable-field").removeClass("field-sel")


        $("#search-var").html("")


        var all_search_btns = [...$(".search-btn")]
        all_search_btns.forEach(btn=>{btn.classList.remove("search-sel")})
        block_btn.classList.add("search-sel")

        var block_name = block_btn.innerText
        var block_vars = Object.keys(mapped_fields[block_name])
        block_vars.forEach((name)=>{
            var name_btn = document.createElement("button")
            name_btn.classList.add("search-var-btn")      // for identification
            name_btn.classList.add("search-btn")            // for style
            name_btn.innerText = name
            name_btn.onclick = highlight_search

            $("#search-var")[0].appendChild(name_btn)

        })

    }
    

    function highlight_search(e){



        [...$(".search-var-btn")].forEach(btn=>{btn.classList.remove("search-sel")})

        $(e.target)[0].classList.add("search-sel")

        $(".mq-editable-field").removeClass("field-sel")

    
        var block_name = $(".search-sel")[0].innerText
        var var_name = e.target.innerText
    
        if ($(".search-sel")[1].innerText!==var_name){throw "didnt switch class properly??"}
    
        var fields = mapped_fields[block_name][var_name]
        console.log(fields)
    
    
    
        mapped_fields[block_name][var_name].forEach((field)=>{
            console.log(field)
            field.classList.add("field-sel")
        })
        console.log(mapped_fields)
    
    }
    
    // PROBABLY NOT GONNA USE ANY MORE
    function map_all_vars(){
    
        // goes through the dom and converts it to a nested dictionary 
        // dictionary contains all the input fields containing a specific varaible and in a specific block
    
        var mapped_fields = {}
    
        // iterate over each block
        $(".block").each(function(){
            var block = $(this)
            var fields = [...block.find(".mq-editable-field").not("input-error")]




            var block_name = block.find(".block-name-txt")[0].value
    
            var mapped_block = {}
            mapped_fields[block_name] = mapped_block

            fields.forEach(field=>{
                if (field.parentElement.tagName.toUpperCase()==="TD"){
                    get_field_vars(field,true)
                }else{
                    get_field_vars(field,false)
                }
            })
          
    
            // iterate over each field in the block

            function get_field_vars(field,is_sub){
                field.classList.remove(".search-sel")
                var field_ltx = MQ(field).latex()
                try{
                    // TODO conversion shouldnt be necessary
                    var field_input = ltx_to_math(field_ltx)
                }catch{
                    var field_input = []
                }
                
                if (field_input.includes("=")||is_sub){
                    var field_vars = get_all_vars(field_input, false)
                }else{
                    var field_vars = []
                }

    
                // iterate over each variable in the field
                field_vars.forEach(field_var=>{
                    if (mapped_block[field_var]===undefined){
                        mapped_block[field_var] = []
                    }
                    mapped_block[field_var].push(field)
    
                })
            }
    
    
    
        })
    
        return mapped_fields
    
        
    }
    
}


function load_library(){

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
/*

things for popup:

    library
    variable search
        requires search_for_vars() if im not searching each keystroke 
            --> should be separate functions
            --> call one main function
    solve steps
    (future) account
    (future) help


*/

function toggle_library(e){
    switch_popup("load",e)
    //load_library()
}


function toggle_var_search(e){
    switch_popup("search-box",e)
    search_for_vars()
}

function toggle_solve_steps(e){
    switch_popup("solve-steps",e)
}

function switch_popup(sel_child_name,e){

    // change button colors:

    const sel_btn = e.target
    const all_btns = [...sel_btn.parentNode.children]

    all_btns.forEach(btn=>{
        btn.classList.remove("popup-sel-btn-selected")
    })



    // switch the popup:

    const sel_child = $("#"+sel_child_name)[0]

    const popup = sel_child.parentElement

    const all_children = [...popup.children]

    all_children.forEach(child=>{
        
        if (child===sel_child){return}

        child.style.display = "none"
        
    })

    if(sel_child.style.display==="block"){
        sel_child.style.display = "none"
    }else{
        sel_child.style.display = "block"
        sel_btn.classList.add("popup-sel-btn-selected")

    }

}

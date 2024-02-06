
var MQ = MathQuill.getInterface(2);


const trig_names = "sin cos tan csc sec cot sinh cosh tanh csch sech coth arcsin arccos arctan arccsc arcsec arccot arcsinh arccosh arctanh arccsch arcsech arccoth"
const selected_greek_names = "pi alpha theta omega tau"


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
        name:"A",
        info: "hi",
        eqns: [
            {input: "a+b=2"},
        ]
    },


]

const equation_visuals = []
var GLOBAL_solve_stuff = null // oh god......

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



document.addEventListener('keyup', (e)=>{
    if (e.code==="Enter"){
        var in_field=document.activeElement
        if (e.ctrlKey){
            // resetGS()
            run_sheet()
        }else if(in_field.tagName=="TEXTAREA"){

            const in_table = $(in_field).parents("td").length === 1

            if (!in_table){ 
                add_line(in_field)
            }
            
        }else if(in_field.className=="block-name-txt"){
            
            
            const is_solve_field = in_field.id === "solve-field"

            if (!is_solve_field){
                add_block(in_field)    
            }
            
            
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
    GLOBAL_solve_stuff = {reference:""}
    $(".block").remove()
    const main  = $("#calc")[0]
    main.appendChild(make_block())
    main.appendChild(make_solve_block())
    window.location.hash = ""

}

//const save_btn = document.getElementById("save-btn")
function save_sheet(){

    const url = window.location.hash

    

    const path_list = url.replaceAll("#","").split(".")

    const folder_path = path_list.slice(0,path_list.length-1)


    const sheet_name = document.getElementById("save-field").value


    // const sheet_name_target = all_names.join(".").replaceAll(" ","-")


    
    const is_alphanumeric =  /^[a-zA-Z0-9\s]+$/.test(sheet_name)

    if (sheet_name === ""){
        alert("Sheet name cannot be blank.")
        return
    }
    if (!is_alphanumeric){
        alert("Sheet name must only contain letters and numbers.") 
        return
    }




    const blocks = JSON.parse(JSON.stringify((DOM2data())))
    const solved_blocks = calc(blocks,0,blocks.length)

    // just cause of firebase
    const sanitized_solved_blocks = replace_errors_with_messages(solved_blocks)
    const sanitized_solve_stuff = replace_errors_with_messages(GLOBAL_solve_stuff)

    const sheet_data = {name: sheet_name, blocks: sanitized_solved_blocks, visuals: equation_visuals, solve_stuff: sanitized_solve_stuff}
    

    //! for now always saving into top folder
    // save_content(firebase_data, "", sheet_data, true)
    

    let place_to_save

    if (CURRENT_USER){

        if (!firebase_data.Users[CURRENT_USER]){
            firebase_data.Users[CURRENT_USER] = []
        }
        place_to_save = firebase_data.Users[CURRENT_USER]
    }else{
        place_to_save = firebase_data.Library
    }


    // const place_to_save = get_folder_content(folder_path.join("/"),get_firebase_data(CURRENT_USER))

    save_content(place_to_save, "", sheet_data, true)

    // delete_content(firebase_data,dir, old_sheet_name)
    // save_content(firebase_data, folder_path, sheet_data, true)

    // window.location.hash = full_path
    // send_to_url()

    database.set(firebase_data)    

    write_url(CURRENT_USER, [folder_path,sheet_name].flat())

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

    const library_labels = [...$(".library-label")]

    let user_data
    if (!firebase_data.Users || !firebase_data.Users[CURRENT_USER]){
        user_data = []
        library_labels.forEach(label => {label.style.display = 'none'})
    }else{

        user_data = firebase_data.Users[CURRENT_USER]
        $("#user-content-label")[0].innerText = `${CURRENT_USER}'s Content`
        library_labels.forEach(label => {label.style.display = ''})
        
    }



    replace_UI_tree(user_data, user_content_root, create_user_buttons)
    replace_UI_tree(firebase_data.Library, library_root, create_library_buttons)


    
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
        throw "should only have one pipe in the url"    // TODO should be a page not found error as well
    }
    const split_path = content_target.replaceAll("-"," ").split(".")
    load_sheet(split_path, owner);
    


}



window.addEventListener('hashchange', send_to_url);


function create_unknown_page(){
    $("#page-not-found")[0].style.display = "block"

    remove_element_ids = ["top-menu","popup","vis"]

    for (id of remove_element_ids){
        $(`#${id}`)[0].style.display = 'none'
    }

    $(".block").remove()

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
    
    GLOBAL_solve_stuff = possible_sheets[0].solve_stuff

    const sanitized_sheet_data = possible_sheets[0].blocks

    const sheet_data = replace_messages_with_errors(sanitized_sheet_data)



    resetGS()    

    document.getElementById("save-field").value=sheet_name

    //! will not produce a visual right now (would have to run compute_sheet first to get the vis equations), then call use_calc_results
    data2DOM(sheet_data)

    if (sheet_visuals !== undefined){
        // checking if undefined just cause of stuff i saved before adding the visuals attribute
        // getting dictionary values cause of stupid firebase ):<
        display_vis(Object.values(sheet_visuals).flat())
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
    delete_btn.classList.add("library-delete-btn")
    delete_btn.innerText = "X"

    const really_delete_btn = document.createElement('button')
    really_delete_btn.innerText = `Delete`
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

        if (block[0].id === "solve-block"){
            return
        }

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
            data[block_i].eqns.push({input:"",show_output:""})
        }
    })

    // oh god this is awful


    const block_to_solve = $("#solve-field")[0].value
//    MQ($("#solve-field")[0]).latex()
    const table_for_solving = get_sub_data($("#solve-table")[0])

    GLOBAL_solve_stuff = {
        reference: block_to_solve,
    }

    const step_spinners = [...$("#spinner-row").children().children(".spinner-step")]

    const step_sizes = {}

    step_spinners.forEach(spinner => {
        
        const cell = spinner.parentNode
        const row = cell.parentNode

        const cell_siblings = [...row.children]

        const spinner_idx = cell_siblings.indexOf(cell)

        const variables = table_for_solving.data[0]
        
        const spinner_var = remove_char_placeholders(variables[spinner_idx])

        step_sizes[spinner_var] = spinner.value
        
    })

    GLOBAL_solve_stuff.step_sizes = step_sizes
    
    
    // so firebase doesn't complain about undefined
    if (table_for_solving){
        GLOBAL_solve_stuff.table = table_for_solving
    }    


    return data
} 


function toggle_visual_buttons(display){
    const visual_buttons = $(".visual-toggle")
    for (button of visual_buttons){
        button.style.display = display
    }
}

function data2DOM(SoEs){

    $(".block").remove()

    toggle_visual_buttons("none")
    
    const main = $("#calc")[0]

    for (let i=0;i<SoEs.length;i++){
 
        var row = make_block(SoEs[i])

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

    main.appendChild(make_solve_block())

    if (GLOBAL_solve_stuff){
        show_steps(GLOBAL_solve_stuff.steps)
    }
    
    const steps_element = $("#solve-steps")[0]

    if (steps_element.innerText.replaceAll("\n","").replaceAll(" ","") === ""){
        steps_element.innerText = "Not solving an actual block."
    }
    make_MQ()
}


function show_steps(steps){


    // clear the solve steps from the previous step
    $("#solve-steps")[0].innerHTML = ""
    
    // called by data2DOM directly instead

    if (steps === undefined){
        return
    }



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


    if (steps.error){
        all_lines.push(`\\text{${steps.error}}`)
    }



    const container = $("#solve-steps")[0]

    all_lines.forEach(line => {

        container.appendChild(wrap_static_MQ(line, false))

    })



    
}

function toggle_blocks(){


    blocks = [...$(".block")]
    toggle_blocks_button = $("#toggle-blocks")[0]
    toggle_blocks_text = toggle_blocks_button.innerText

    let show
    if (toggle_blocks_text === "Show"){
        toggle_blocks_button.innerText = "Hide"
        show = true
    }else{
        toggle_blocks_button.innerText = "Show"
        show = false
    }

    for (block of blocks){
        
        if (block.id === 'solve-block'){
            continue
        }

        if (show){
            block.style.display = ''
        }else{
            block.style.display = 'none'
        }
  
    }

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
        add_line(e.target)
        track_dom()
    }

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
        change_start_idx($(button).parents(".block").index())

        outer[0].removeChild(line[0])
        if (n_lines===1){
            outer[0].appendChild(make_line())
        }  
        track_dom()
    }
    
    remove_button.className="line-btn"  // i dont think this is used
    remove_button.classList.add("add-remove-btn")
    remove_button.classList.add("remove-line-btn")
    remove_button.appendChild(make_tooltip())

    var in_field=document.createElement('div')
    in_field.classList.add("line-input")
    in_field.classList.add("MQ-input")
    

    //MQ
    MQ.MathField(in_field, {
        //autoCommands: "sqrt", // to just type instead of backslash
        autoCommands: selected_greek_names,
        autoOperatorNames: trig_names+" visual",
        handlers: {edit: function() {
        
            // for some reason, MQ runs it on creation, before there are parent elements ):<
            if(in_field.parentElement===null){
                return 
            }

            var calc_row = in_field.parentElement.parentElement.parentElement
            var idx = [].indexOf.call(calc_row.parentNode.children, calc_row);       
            change_start_idx(idx)

            return


            in_field.classList.remove("input-error")


            var row = $(in_field).parents(".line")


            var remove_classes = [".collapse-arrow",".error-msg",".display-eqn-cell"]//,".sub-table"]

            remove_classes.forEach((cl)=>{
                var item = row.find(cl)[0]
                if (item===undefined){return}
                item.style.display = "none"
            })

    }}
    })   // editing it should change the start_idx for solving





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
        out_field.innerHTML = display_eqns.message  // this occurs only when it's an error or new line
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
            if (arr_row.error instanceof Error){
                row.innerText = arr_row.error.message
                row.classList.add("error-msg")
            }else if (typeof(arr_row) === "string"){
                // this is soooooooo fucking bad
                // firebase can't save error messages, so i replaced them with strings
                // i then undo this when loading the sheet, but i check for error attributes
                // here it's not saved as an error attribute
                // so it doesn't convert from string
                row.innerText = arr_row
                row.classList.add("error-msg")

            }
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

    if (eqn.sub_table || is_error){
        line.appendChild(output_arr)
        line.appendChild(out_field)    
    }
    
    //! for now just showing steps for first one
    // show_steps(eqn.solve_steps)

    return line


}

function format_visual_eqn(eqn){
    const expression = eqn.split("=")[0]
    const parts = expression.split("|VISUAL")
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

    const unknown_vars = visual_vars.filter((vis_var,idx) => {
        const value = values[idx]
        return get_all_vars(value).length !== 0
    })

    if (unknown_vars.length === 0){
        return `\\text{${visual_name} visual, displayed}`
    }else{
        return `\\text{${visual_name} visual, unknown: } ${unknown_vars.join("\\text{,  }")}`
    }


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



function add_block(field){
    // called both by the button to add a block and by pressing Enter
    // field could either be the X button or the input field
    var block= $(field).parents(".block")[0]
    var main = block.parentNode
    var next_row = block.nextElementSibling
    var new_row=make_block()
    main.insertBefore(new_row,next_row)
    //$(new_row).find(".line-input")[0].focus()


        

    var idx = [].indexOf.call(new_row.parentNode.children, new_row)+1;
    change_start_idx(idx)
}


function make_solve_block(){

    // you do need to have a result so sub table knows what's input vs output
    // i could change this though........




    const block = document.createElement("div")
    block.id = "solve-block"
    block.classList.add("block")
    
    const solve_span_height = "20px" // cause screw css's attempt at variables

    const solve_span = document.createElement("span")
    solve_span.innerText = "Solve"
    solve_span.style.fontSize = solve_span_height
    solve_span.id = "solve-txt"

    const reference_line = document.createElement("div")
    reference_line.style.marginTop = "10px"
    reference_line.style.marginBottom = "25px"
    reference_line.style.marginRight = "20px"
    reference_line.style.height = solve_span_height
    reference_line.style.fontSize = solve_span_height

    block.appendChild(reference_line)

    var in_field = document.createElement('input')
    in_field.id = "solve-field"
    in_field.classList.add("block-name-txt")
    in_field.placeholder = "Block to solve"
    in_field.style.width="150px"
    in_field.style.marginRight="0px"
    // MQ.MathField(in_field)

    reference_line.appendChild(solve_span)
    reference_line.appendChild(in_field)

    let table


    if (!GLOBAL_solve_stuff || !GLOBAL_solve_stuff.result){
        $("#toggle-solve-steps")[0].style.display="none"
        return block
    }





    // MQ(in_field).latex(GLOBAL_solve_stuff.reference)


    in_field.value = GLOBAL_solve_stuff.reference

    $("#toggle-solve-steps")[0].style.display=""



     
    table = make_sub_table(GLOBAL_solve_stuff.solved_table, GLOBAL_solve_stuff.result, true)
    table.id = "solve-table"


    block.appendChild(table)


    const solve_result = GLOBAL_solve_stuff.result[0]


    const has_error = solve_result.error !== undefined

    
    const error_field=document.createElement('span')
    error_field.id = "solve-error-msg"
    error_field.classList.add("error-msg")
    block.appendChild(error_field)

    if (has_error){

        const error = solve_result.error
        let error_message
        if (error instanceof Error){
            error_message = error.message
        }else{
            error_message = error // this happens when you're loading what was saved, cause you can't save an error
        }
        error_field.innerText = error_message  // this occurs only when it's an error or new line
        // error_field.classList.add("error-msg")
        // in_field.classList.add("input-error")
        show_output = "block"    

        
    }

    return block

    
}






function make_block(SoE){

    var block=document.createElement('div')
    

    block.className="block"

    // TODO copy and paste i am beyond caring at this point though
    toggle_blocks_button = $("#toggle-blocks")[0]
    toggle_blocks_text = toggle_blocks_button.innerText
    if (toggle_blocks_text === "Show"){
        block.style.display = 'none'
    }

    var remove_button=document.createElement('button')
    remove_button.onclick=function(event){

        if (($(".block")).length === 2){
            return
        }

        var outer=block.parentNode

        change_start_idx([].indexOf.call(block.parentNode.children, block) )

        outer.removeChild(block)
        track_dom()

    }
    remove_button.innerHTML="X"
    remove_button.className="block-remove"
    remove_button.classList.add("add-remove-btn")
    remove_button.classList.add("remove-block-btn")
    remove_button.appendChild(make_tooltip())

    var add_btn = document.createElement("button")
    add_btn.onclick = (e) => {
        add_block(e.target)
        track_dom()
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
        // name_field.classList.remove("input-error")
        // $(name_field).parents(".block").find(".block-error-msg")[0].style.display = "none"
        var row = e.target.parentElement.parentElement.parentElement
        change_start_idx([].indexOf.call(row.parentNode.children, row))
    }
    name_field.placeholder = "Block name"
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

    if ($("#toggle-blocks")[0] === "Show"){
        block.style.display = 'none'
    }

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


function spinner_adjust(spinner_button,sign){
    
    const cell = $(spinner_button).parents("td")[0]
    const all_cells = [...$("#spinner-row").children("td")]
    const cell_idx = all_cells.indexOf(cell)
    
    const step_field = $(spinner_button).siblings(".spinner-step")[0]
    const step_size = Number(step_field.value)*sign

    
    const top_cells = [...$("#solve-table")[0].children[0].children]
    const value_cells = [...$("#solve-table")[0].children[1].children]

    const value_cell = value_cells[cell_idx]

    const value_field_MQ = MQ(value_cell.children[0])

    const old_value = Number(value_field_MQ.latex())
    const new_value = old_value+step_size

    const n_places = 3
    const new_rounded_value = Math.round(new_value*10**n_places)/10**n_places

    value_field_MQ.latex(String(new_rounded_value))


    clear_equation_visuals()

    const sheet_data= DOM2data()
    calc(DOM2data(sheet_data),0,sheet_data.length)

    const solve_output_eqns = GLOBAL_solve_stuff.result[0]
    const solve_output = {}


    const error_field = $("#solve-error-msg")[0]
    if (solve_output_eqns.error instanceof Error){
        const error_message = solve_output_eqns.error.message

        error_field.innerText = error_message

        return

    }else{
        error_field.innerText = ""
    }

    solve_output_eqns.forEach(eqn => {
        const stuff = eqn.split("=")
        const solve_var = remove_char_placeholders(stuff[0])
        const solve_val = stuff[1]
        solve_output[solve_var] = solve_val
    })


    

    top_cells.forEach((var_cell, idx) => {
        const value_cell = value_cells[idx]
        const value_field = MQ(value_cell.children[0])

        const variable = MQ(var_cell.children[0]).latex()

        
        const new_value = solve_output[variable]

        if (new_value === undefined){
            return
        }


        const rounded_cell_val = round_decimals(new_value, 3)

        value_field.latex(rounded_cell_val)


        
        
    })


    display_vis(equation_visuals.flat(), false)

}


var update_up_press = () => {
    last_spinner_pressed = null
    n_since_spinner_pressed = null
}


// attaching it to document instead of spinner buttons cause you can move your mouse away from the button and then release
document.onmouseup = update_up_press




let last_spinner_pressed = null
let n_since_spinner_pressed = null

setInterval(check_spinner_pressed,100)

function check_spinner_pressed(){


    const just_clicked = n_since_spinner_pressed === 0

    const held_down = n_since_spinner_pressed > 3

    if (just_clicked || held_down){
 
        const siblings = [...last_spinner_pressed.parentNode.children]
        const spinner_idx = siblings.indexOf(last_spinner_pressed)
    
        let sign
        if (spinner_idx == 0){
            sign = -1
        }else if(spinner_idx === 2){
            sign = 1
        }else{
            throw "index isn't at spinner, could happen if i changed the spinner layout"
        }
    
        spinner_adjust(last_spinner_pressed,sign)
      
    }
      
    if (n_since_spinner_pressed !== null){
        n_since_spinner_pressed ++
    }
    

}


function make_sub_table(table_data, solve_result, is_solve_line){


    
    var table = document.createElement("table")


    let base_vars

    // my code has descended into madness
    // checking outputsolveidxs undefined since
        // if it's not undefined, it's still the old table before it hit an error
        // this happens if you create a table, then do something after that immediately hits an error (e.g. invalid block name)
    if (table_data!==undefined && table_data.output_solve_idxs === undefined && table_data.length!==0){

        base_vars = table_data[0]

        const unsorted_base_vars = JSON.parse(JSON.stringify(base_vars))

        table_data[0] = unsorted_base_vars

        base_vars.sort()


        const sort_idxs = base_vars.map(unsorted_var => {
            return unsorted_base_vars.indexOf(unsorted_var)
        })


        // fuck firebase omg
        if (solve_result !== undefined && solve_result[0].output_idxs === undefined){
            solve_result[0].output_idxs = []
        }

        for (let i=0;i<table_data.length;i++){

            const row = table_data[i]
            const sorted_row = sort_idxs.map(idx => {
                return row[idx]
            })



            let solve_output_eqns

            const editable = i!==0

            //! should only be an array containing an error now
            const contains_error = editable && solve_result!== undefined && solve_result[i-1].error !== undefined
            if (i===0 || contains_error || !is_solve_line){
                solve_output_eqns = []
            }else{
                solve_output_eqns = solve_result[i-1]
            }

            let blank_idxs
            if (contains_error){

                const output_idxs = solve_result[i-1].output_idxs

                blank_idxs = output_idxs.map(output_idx => {
                    return sort_idxs.indexOf(output_idx)
                })


            }else{
                blank_idxs = []
            }
            
            const fuck_firebase = blank_idxs === undefined
            if (fuck_firebase){
                blank_idxs = []
            }


            const new_row = make_row(sorted_row,editable,solve_output_eqns,blank_idxs)

            if (contains_error){
                
                new_row.style.outline="thin solid red"
                
            }
			table.appendChild(new_row)
        }
    

        table.className = "sub-table"
    
    
        if (is_solve_line && !solve_result[0].error){
            const spinner_row = document.createElement("tr")
            spinner_row.id = "spinner-row"
            const value_row = table.children[1]
            const value_cells = [...value_row.children]
            const variable_row = table.children[0]
            const variable_cells = [...variable_row.children]

            let step_sizes = GLOBAL_solve_stuff.step_sizes
            if (!step_sizes){
                step_sizes = {}
            }

            value_cells.forEach((value_cell,cell_idx) => {


                const mq_value_field = value_cell.children[0]
                const is_input = [...mq_value_field.classList].includes('mq-editable-field')
                
                let spinner_field
                if (is_input){
                    
                    const mq_var_field = MQ(variable_cells[cell_idx].children[0])
                    const spinner_variable = mq_var_field.latex()
    
                    let spinner_value
    
                    if (Object.keys(step_sizes).includes(spinner_variable)){
                        spinner_value = step_sizes[spinner_variable]
                    }else{
                        spinner_value = .1
                    }
                    
                    spinner_field = make_spinner_field(spinner_value)
                }else{
                    spinner_field = document.createElement("td")
                }

                spinner_row.appendChild(spinner_field)
                

            })
            table.appendChild(spinner_row)

        }



    }
    
    function make_spinner_field(step_size){

        const field = document.createElement("td")

        
            
        
        const left_spinner = document.createElement("button")
        left_spinner.innerText = "◀"
        left_spinner.classList.add("solve-spinner")
        // left_spinner.onclick = spinner_decrement

        const step_size_field = document.createElement("input")
        step_size_field.type = 'number'
        step_size_field.title = 'Spinner step size'
        step_size_field.classList.add("spinner-step")
        step_size_field.value = step_size

        const right_spinner = document.createElement("button")
        right_spinner.innerText = "▶"
        right_spinner.classList.add("solve-spinner")


        const update_down_press =  (e) => {
            last_spinner_pressed = e.target
            n_since_spinner_pressed = 0
        }
        

        left_spinner.onmousedown = update_down_press
        right_spinner.onmousedown = update_down_press
        // left_spinner.onmouseup = update_up_press
        // right_spinner.onmouseup = update_up_press


        field.appendChild(left_spinner)
        field.appendChild(step_size_field)
        field.appendChild(right_spinner)            
        return field
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
                MQ.MathField(in_field, {
                    autoCommands: selected_greek_names,
                    autoOperatorNames: trig_names,
                    handlers: {edit: function() {
                    
                    if(in_field.parentElement===null){
                        return 
                    }
                    change_start_idx($(in_field).parents(".block").index())

                }}})

            }
            
            let rounded_cell_val

            if (!blank_idxs.includes(idx)){
                // round_decimals is actually overkill
                    // that rounds all numbers in an expression
                    // i only need to round a single number
                rounded_cell_val = remove_char_placeholders( round_decimals(cell_val, 3))
                MQ(in_field).latex(rounded_cell_val)
            }
           



            var cell = document.createElement("td")

            if (is_solve_line && not_first_row){
                let n_digits
                if (rounded_cell_val){
                    n_digits = rounded_cell_val.toString().length
                }else{
                    n_digits = 0
                }
                width = Math.max(n_digits*10+20,50)
            }else{
                width = 50
            }

            in_field.style.width = `${width}px`
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
                change_start_idx($(e.target).parents(".block").index())
                track_dom()
			}


			var remove = document.createElement("button")
            remove.classList.add("table-remove")
			remove.innerText = "X"
			remove.onclick = (e)=>{
                change_start_idx($(e.target).parents(".block").index())

				if(table.childElementCount>2){
					row.remove()
				}
                track_dom()
			}

			var clear = document.createElement("button")

            if (is_solve_line){
                clear.classList.add("solve-table-clear")
            }else{
                clear.classList.add("table-clear")
            }
            
			clear.innerText="-"
			clear.onclick = (e)=>{

                if (is_solve_line){
                    $("#spinner-row")[0].style.display = 'none'
                }
                
                change_start_idx($(e.target).parents(".block").index())

				var blank = [];base_vars.forEach(()=>{blank.push("")})

                const new_row = make_row(blank,true,[],[])

                for (let i=0; i<row.children.length; i++){

                    if (!is_solve_line){
                        break
                    }

                    const old_cell = row.children[i]
                    const new_cell = new_row.children[i]
                    const old_MQ_field = old_cell.children[0]
                    const new_MQ_field = new_cell.children[0]
                    const is_editable = [...old_MQ_field.classList].includes('mq-editable-field')
                    if (is_editable){

                        MQ(new_MQ_field).latex(old_MQ_field.innerText)
                        // MQ_field.innerText = ""
                    }
                    // console.log(`${MQ_field.innerText}: ${is_editable}`)
                }

				table.insertBefore(new_row, row.nextSibling)
				
				row.remove()

                track_dom()

			}

            let btns_to_include
            if (is_solve_line){
                btns_to_include = [clear]
            }else{
                btns_to_include = [add, remove, clear]
            }

			btns_to_include.forEach((btn)=>{
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
        if (row.id==="spinner-row"){
            continue
        }
        var cells = row.children
        data.push([])
        for (let j=0;j<cells.length;j++){
            var cell = cells[j]
            var mq_field = cell.children[0]
            if(!(mq_field.className.includes("mq"))){continue}
            const ltx_raw = MQ(mq_field).latex().replaceAll("\\ ","")
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
    let scene=canvas({width: graphDiv.offsetWidth,height: graphDiv.offsetHeight,resizable: true,userzoom: true,autoscale: true,resizable:false})
    //scene.forward=vec(1,-0.5,-1)

    return scene
}




function view_xy(){
    scene.forward = vec(0,0,-1)
    adjust_scale()
}



function view_3d(){
    scene.forward = vec(-1,-1,-1)
    adjust_scale()
}


function make_tooltip(){
    var tooltip = document.createElement("div")
    tooltip.classList.add("tooltip")
    return tooltip
}

$("#run-button")[0].appendChild(make_tooltip())

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
        return
    })

}


var hist_doms = [[DOM2data(),GLOBAL_solve_stuff]]
var hist_idx = 0

max_hist = 10

// ill just save the data instead of DOMs (adding doms messes up mq focus fields for some reason)





function copy(stuff){
    // idk how but calc must mutate the data somehow cause it leads to error when i don't copy
    // now it works :)
    // don't even question it
    return JSON.parse(JSON.stringify(stuff))
}


function undo(){
    var past_dom = hist_doms[hist_idx-1]

    if (past_dom===undefined){return}
    //  in reality would be a callback
    // data2DOM(calc(past_dom,0,past_dom.length))
    GLOBAL_solve_stuff = past_dom[1]
    const non_solve_stuff = past_dom[0]
    data2DOM(calc(copy(non_solve_stuff),0,non_solve_stuff.length))
    hist_idx-=1
    //document.body.appendChild(past_dom[0])
}

function redo(){


    var future_dom = hist_doms[hist_idx+1]

    // if i don't peform a calc, it loses the sub table data, don't even ask

    if (future_dom===undefined){return}

    GLOBAL_solve_stuff = future_dom[1]
    
    const non_solve_stuff = future_dom[0] // amazing variable name :)
    data2DOM(calc(copy(non_solve_stuff),0,non_solve_stuff.length))

    hist_idx+=1
}


function track_dom(){
    return
    var current_dom = [DOM2data(),copy(GLOBAL_solve_stuff)]

    var past_dom = hist_doms[hist_idx]



    if (JSON.stringify(current_dom)!==JSON.stringify(past_dom)){
        hist_idx+=1
        hist_doms = hist_doms.slice(0,hist_idx)
        hist_doms.push(current_dom)
    }



}


document.addEventListener('keyup', track_dom)

/*
const modify_buttons = [...$(".add-remove-btn")]

modify_buttons.forEach(button => {
    if ([...button.classList].includes("library-delete-btn")){
        return
    }
    const old_on_click = button.onclick

    const new_on_click = (e => {
        old_on_click(e)
        console.log('hi')
    })

    button.onclick = new_on_click
})
*/

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
        btn.classList.remove("menu-text-selected")
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
        sel_btn.classList.add("menu-text-selected")

    }

}



// glowscript prevents it from automatically doing this
// for some reason gs also prevents onmousedown from working
$("#vis")[0].onmouseup = () => {
    console.log('hi')
    const mq_fields = [...$(".mq-editable-field")]

    mq_fields.forEach(field => {
        MQ(field).blur()
    })

    const regular_fields = [...$("input")]

    regular_fields.forEach(field => {
        field.blur()
    })

}

function display_vis(vis_eqns, scale_needs_adjusting = true){
    

    if (vis_eqns.length > 0){
        toggle_visual_buttons("")
    }
    


    resetGS()
    
    vis_eqns.forEach(eqn=>{
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
            const vis_var = vis_vars[i] // remove placeholders so i can use the original latex 
            const vis_exp = vis_exps[i]
            if (vis_exp.includes("NaN")){
                throw "shouldnt have nan"
            }

            const is_color_var = vis_exp.includes('"')
            if (is_color_var){
                vis_input[vis_var] = vis_exp.replaceAll("(","").replaceAll(")","")
                return
            }
            try{
                var vis_val = math.evaluate(ltx_to_math(vis_exp))
            }catch{
                throw "could not solve for all values for visual "+vis_name+" shouldnt happen??"
            }                
            vis_input[vis_var] = vis_val
        })

        sel_vis.vis(vis_input)

    })

    if (scale_needs_adjusting){
        adjust_scale()
    }
     
    
}

function get_quad_range(quad_object, dim){
    
    const vertex_keys = ["v0","v1","v2","v3"]

    const coords = vertex_keys.map((vertex) => {
        return quad_object[vertex]["pos"][dim]
    })

    return [min(coords), max(coords)]
}


function get_triangle_range(triangle_object, dim){
    
    const vertex_keys = ["v0","v1","v2"]

    const coords = vertex_keys.map((vertex) => {
        return triangle_object[vertex]["pos"][dim]
    })

    return [min(coords), max(coords)]
}





// function get_curve_range(object, dim){

//     const point_idxs = [...Array(object.npoints).keys()]
    

//     const locations = point_idxs.map(point_idx => {
//         const point = object.point(point_idx)
//         return get_point_range(point, dim)[0]
//     })
    

//     return [min(locations), max(locations)]
// }

function get_point_range(object, dim){
    const position = object.pos[dim]
    return [position, position]
}

function get_object_range(object, dim){
    const min_pos = object.pos[dim] - object.size[dim]/2
    const max_pos = object.pos[dim] + object.size[dim]/2
    range =  [min_pos,max_pos]    
    return range
}

function adjust_scale(){
 
    // this is basically what gs does but i can't figure out how to toggle it on and off
        // by default, gs stops autoadjusting the scale once the range is set (either in code or by zooming)
        
    const dim_keys = ["x","y","z"]

    const bounds = {}

    let bounds_set = false

    for (object of scene.objects) {

        if (!object.visible){
            continue
        }

        for (dim of dim_keys){

            let range

            if (object instanceof label){
                break
            }else if (object instanceof curve){
                break // gets the range automatically with the points
            }else if (object instanceof quad){
                range = get_quad_range(object, dim)
            }else if (object instanceof triangle){
                range = get_triangle_range(object, dim)
            }else if (object.constructor.name === "point"){
                // point isn't defined since it's not a user level function to create something
                range = get_point_range(object, dim)
            }else{
                range = get_object_range(object,dim)
                
            }

            const new_bounds = range.map((val,idx) => {

                if (bounds[dim] === undefined){
                    return val
                }

                let compare_func
                if (idx == 0){compare_func = min}
                else {compare_func = max}
                return compare_func(val, bounds[dim][idx])
            })

            bounds_set = true
            bounds[dim] = new_bounds
        }
    }

    if (!bounds_set){
        return
    }

    const center = Object.values(bounds).map(bound => {
        return (bound[1]+bound[0])/2
    })

    const ranges = Object.values(bounds).map(bound => {
        return bound[1]-bound[0]
    })
    
    const range = max(ranges)

    // alternatively set the center to vec(0,0,0) and for the range consider the max of the absolute distance from the origin
    scene.center = vec(...center)
    scene.range = range
    
}



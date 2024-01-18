function is_folder(content){
    return Object.keys(content).includes('children')
}


function get_folder_content(path, trees){
    
    if (path === ""){
        return trees
    }
    
    const search_path = path.split("/")

    let content = trees

    
    for (search_folder_name of search_path){

        if (content === undefined){
            throw `no folders with name ${search_folder_name}, parent doesn't have folders`
        }

        const located_sub_folders = content.filter(sub_boop => {return sub_boop.name === search_folder_name})
        
        if (located_sub_folders.length > 1){
            throw  `multiple folders with sanme name: ${search_folder_name}`
        }else if (located_sub_folders.length === 0){
            throw  `no folders with name: ${search_folder_name}`
        }

        content = located_sub_folders[0].children
    }


    if (content === undefined){
        throw `${path} is a file, not a folder`
    }
    return content
}

function save_folder(trees, directory,folder_name ){
    
    const new_folder = {name: folder_name, children: ["blank"]} // cant use empty array cause firebase removes it ):

    save_content(trees, directory, new_folder)

}

function change_content_order(trees, directory, name, name_to_go_before){
    
    const siblings = get_folder_content(directory, trees)

    const indices = [...siblings.keys()]


    const from_index = indices.filter(idx => {return siblings[idx].name === name})[0]

    if (!from_index){
        throw `${name} is not a sheet name`
    }



    const item = siblings[from_index]

    const to_index = indices.filter(idx => {return siblings[idx].name === name_to_go_before})[0]

    if (!to_index){
        throw `${name_to_go_after} is not a sheet name`
    }

    siblings.splice(from_index,1)
    siblings.splice(to_index,0,item)


}

function arraymove(arr, fromIndex, toIndex) {
    var element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
    return arr
}

function save_content(trees, directory, content, allow_overwrite = false){
    

    if (typeof content !== "object"){
        throw "content must be an object"
    }

    if (!Object.keys(content).includes("name")){
        throw "content must have a name attribute"
    }

    const siblings = get_folder_content(directory, trees)
    
    

    const other_names = siblings.map(sibling => {return sibling.name})


    const content_idx = other_names.indexOf(content.name)



    if (content_idx === -1){
        siblings.push(content)
        return
    }



    const competing_content = siblings[content_idx]

    const is_conflict = is_folder(content) === is_folder(competing_content)

    
    if (!is_conflict){
        siblings.push(content)
        return
    }


    if (!allow_overwrite){
        let content_type
        if (is_folder(content)){content_type = "folder"}
        else{content_type = "sheet"}
        throw `${content.name} already a ${content_type} in the directory`
    }

    siblings[content_idx] = content


    
}



function delete_content(trees, directory, content_name, should_delete_folder = false){

    // could be either a folder or content

    const old_siblings = get_folder_content(directory, trees)
    
    const all_contents = old_siblings.filter(sibling => {return   sibling.name === content_name})

    const contents = all_contents.filter(content => {return is_folder(content) === should_delete_folder})

    if (contents.length === 0){
        throw `${content_name} not in directory`
    }else if (contents.length > 1){
        throw "shouldnt happen, shouldnt allow multiple to be saved with same name"
    }

    const content = contents[0]

    const old_idx = old_siblings.indexOf(content)

    old_siblings.splice(old_idx, 1)



    return content
}

function move_content(trees, old_directory, new_directory, content_name){
    // again either a folder or content

    const content = delete_content(trees, old_directory, content_name)

    save_content(trees, new_directory, content)
}

function replace_UI_tree(trees, container, item_function){

    container.innerHTML = ""
    const toggle = create_UI_tree_list(trees, item_function)

    //return toggle
    container.appendChild(toggle)
}

function create_UI_tree_list(trees, item_function, past_names = undefined) {

    if (past_names === undefined){
        past_names = []
    }

    const depth = past_names.length

    // Create the main container element
    const container = document.createElement('div');
    
    container.style.paddingLeft = `${depth*15}px`

    for (const tree of trees) {


        if (tree === "blank"){
            continue
        }
        subname = tree.name
        all_names = [...past_names]
        all_names.push(subname)


        if (tree.children === undefined){
            
            const item_container = document.createElement("div")

            item_function(all_names, item_container)

            container.appendChild(item_container)

            continue
        }

        // Create the arrow button
        const arrowButton = document.createElement('button');
        arrowButton.innerText = '▶';

        // Add CSS class to the button
        arrowButton.classList.add('library-arrow-button');

        // Create the text element
        const textElement = document.createElement('span');
        textElement.innerText = subname;

        const boop = document.createElement("div")

        boop.appendChild(arrowButton)
        boop.appendChild(textElement)
            

        // Create the toggle div
        const toggleDiv = document.createElement('div');
        toggleDiv.style.display = 'none';   
        

        if (tree.children === undefined){
            item_function(all_names, toggleDiv)
        }else{
            const child_dropdown = create_UI_tree_list(tree.children, item_function, all_names)
            toggleDiv.appendChild(child_dropdown)
        }
        
        

        toggleDiv.classList.add('toggle-div'); // Add a CSS class for the toggle div

              
      // Function to toggle the visibility of the toggle div
        function toggleDivVisibility() {
            if (toggleDiv.style.display === 'none') {
                toggleDiv.style.display = 'block';
                arrowButton.innerText = '▼';
            } else {
                toggleDiv.style.display = 'none';
                arrowButton.innerText = '▶';
            }
        }
    

            // Append the arrow button and text element to the container
        container.appendChild(boop);

    
        // Add event listener to the arrow button to toggle the div visibility
        arrowButton.addEventListener('click', toggleDivVisibility);
    
        // Append the toggle div to the container
        container.appendChild(toggleDiv);
    }


    return container;
}


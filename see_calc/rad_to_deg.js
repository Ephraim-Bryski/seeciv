

function find_matching_parentheses(text, open_idx){
    
    let depth = 0
    let index = open_idx

    if (text[open_idx] !== "("){
        throw `starting at ${text[open_idx]}, not "("`
    }
    while(true){

        if (index === text.length){
            throw "couldn't find match"
        }

        const char = text[index]

        if (char === "("){
            depth += 1
        }else if (char === ")"){
            depth -= 1
        }

        if (depth === 0){
            return index
        }

        index ++
    }


}


function get_all_indices(text,substring){
    
}


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


function get_all_indices(text,sub_text){
    /*
    this weirdness does two things
        avoids need to check start of line
        offsets indices by 1, which is what i need cause the index matches at the nonalphanum not the start
    */
    const padded_text = "-"+text
    
    // stupid gpt code, of course i needed to correct it :/
    var regex = new RegExp("(\\W)" + sub_text, "g"); // create a dynamic regex with the variable
    var result, indices = []; // initialize an array to store the indices
    while (result = regex.exec(padded_text)) { // loop through the matches
        indices.push(result.index); // push the index of the match to the array
    }
    return indices
}

function rad_to_deg(expression){

    // return expression
    
    const pie = 'pi' //Math.PI.toString()  // who doesntlike pie :)
        
    const get_op = func => {return `${func}\\(`}
    const forward_ops = forward_trig.map(get_op)
    const inverse_ops = inverse_trig.map(get_op)



    const forward_start_idxs = forward_ops.map(op => {return get_all_indices(expression, op)}).flat()
    const inverse_start_idxs = inverse_ops.map(op => {return get_all_indices(expression, op)}).flat()


    const forward_open_idxs = forward_start_idxs.map(idx => {return idx + 3})
    const inverse_open_idxs = inverse_start_idxs.map(idx => {return idx + 4})

    const forward_close_idxs = forward_open_idxs.map(idx => {return find_matching_parentheses(expression, idx)})
    const inverse_close_idxs = inverse_open_idxs.map(idx => {return find_matching_parentheses(expression, idx)})

    

    const chars = expression.split('')

    forward_open_idxs.forEach(idx => {
        chars[idx] = "(("
    })

    forward_close_idxs.forEach(idx => {
        chars[idx] = `)*${pie}/180)`
    })

    inverse_start_idxs.forEach(idx => {
        chars[idx] = "(a"
    })

    inverse_close_idxs.forEach(idx => {
        chars[idx] = `)*180/${pie})`
    })

    return chars.join('')
}


function test_rad_to_deg(){
    
    
    function check_it(before,after){
        if (rad_to_deg(before) !== after){
            console.warn(`u done messed up ${rad_to_deg(before)}`)
        }else{
            console.log('yay :)')
        }
    }

    check_it("a*b+c","a*b+c")
    check_it("sin(a+b)","sin((a+b)*pi/180)")
    check_it("asin(a+b)+3","(asin(a+b)*180/pi)+3")
    check_it("asin(a+b)^2","(asin(a+b)*180/pi)^2")
    check_it("sin(cos(a))","sin((cos((a)*pi/180))*pi/180)")
    check_it("sin(asin(a)+3)","sin(((asin(a)*180/pi)+3)*pi/180)")
    check_it("(a+b)*c","(a+b)*c")

}

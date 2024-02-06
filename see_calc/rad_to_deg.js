

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


function rad_to_deg(expression){

    
    const pie = 'pi' //Math.PI.toString()  // who doesntlike pie :)
        
    const get_op = func => {return `\\${func}(`}
    const forward_ops = forward_trig.map(get_op)
    const inverse_ops = inverse_trig.map(get_op)



    const forward_start_idxs = forward_ops.map(op => {return get_all_indices(expression, op)}).flat()
    const inverse_start_idxs = inverse_ops.map(op => {return get_all_indices(expression, op)}).flat()


    const forward_open_idxs = forward_start_idxs.map(idx => {return idx + 4})
    const inverse_open_idxs = inverse_start_idxs.map(idx => {return idx + 5})

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
        chars[idx] = "(\\"
    })

    inverse_close_idxs.forEach(idx => {
        chars[idx] = `)*180/${pie})`
    })

    return chars.join('')
}


function check_it(before,after){
    if (rad_to_deg(before) !== after){
        console.warn(`u done messed up ${before}`)
    }
}
console.log(rad_to_deg("\\sin(3+\\asin(4))"))


function get_all_indices(text,substring){
    
    let start_idx = 0
    const indices = []
    while (true){
        const index = text.indexOf(substring, start_idx)
        if (index === -1){
            return indices
        }
        indices.push(index)
        start_idx = index + substring.length
    }
    
}
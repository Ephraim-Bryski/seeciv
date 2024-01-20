function remove_unneeded_parentheses(eqn){

    /*
    
    removes parentheses surroundings single variables, for outputting substitution results

    limitation: only removes parentheses surrounding a single variable

    so....

    a=(b+c) --> parentheses won't be removed
    a=((b)) --> a = (b)
    it's fineeeeeeeeeeeee, easier to see what was subbed any way
    */


    function is_in_symbol(char){
        const alpha_num_regex = /[a-z0-9]/

        return alpha_num_regex.test(char) || char === "_"
 
    }

    const chars = eqn.split("")

    let start_idx
    let in_unneeded_parentheses = false

    const unneeded_char_idxs = []


    for (let i=0; i<chars.length; i++){
        const char = chars[i]

        if (char === "("){
            start_idx = i
            in_unneeded_parentheses = true
        }else if (char === ")" && in_unneeded_parentheses){
            unneeded_char_idxs.push(start_idx)
            unneeded_char_idxs.push(i)
            in_unneeded_parentheses = false
        }else if (!is_in_symbol(char)){
            in_unneeded_parentheses = false
        }
    }

    for (idx of unneeded_char_idxs){
        chars[idx] = ""
    }

    const new_eqn = chars.join("")

    return new_eqn
}
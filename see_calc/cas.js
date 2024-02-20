



    
//#region operation information

const arithmetic_ops = ["+","-","*","/","^"]

const inverse_op = {
    "-": "+",
    "/": "*",
    "+": "-",
    "*": "/"
}

const upper_op = {
    "-": "*",
    "/": "^",
    "+": "*",
    "*": "^"
}


function op_priority(op){

    const priorities = {
        "+": 0,
        "-": 0,
        "*": 1,
        "/": 1.5, // always fractions so higher priority than "*"
        "^": 2
    }
    if (!Object.keys(priorities).includes(op)){throw "opeartion "+op+" has no priority defined"}

    return priorities[op]
}

const cum_init_values = {
    "+": "0",
    "*": "1"
}

const cumulative_ops = {
    "+": add_numbers,
    "*": multiply_numbers
}

const flatten_ops = ["+","*"]

const not_cos_trig = ["sin","sec","tan"]
const cos_trig = ["cos","csc","cot"]


const forward_trig = [not_cos_trig,cos_trig].flat()

const inverse_trig = forward_trig.map(func=>{
    return "a"+func
})



const reg_trig = [forward_trig,inverse_trig].flat()

const hyp_trig = reg_trig.map(func=>{
    return func+"h"
})

const trig_funcs = [reg_trig,hyp_trig].flat()

const trig_func_ops = trig_funcs.map(func=>{return func+"("})


const inverse_trig_op_map = {}

trig_func_ops.forEach(func=>{
    const is_inverse_func = func[0] === "a"
    let inverse_func
    if (is_inverse_func){
        inverse_func = func.slice(1)
    }else{
        inverse_func = "a"+func
    }

    inverse_trig_op_map[func] = inverse_func
})


const paren_op = "("

const sqrt_op = "sqrt("

const unitary_ops = [paren_op, sqrt_op].concat(trig_func_ops)

//#endregion


//#region construct and operate on fractions

function construct_fraction(num,den){
    
    let num_value = Number(num)
    let den_value = Number(den)

    const num_abs = Math.abs(num_value)
    const den_abs = Math.abs(den_value)


    function get_gcf(a, b) {
        // euclidean algorithm (just got from chatgpt)
        if (b > a) {
          [a, b] = [b, a];
        }
      
        while (b !== 0) {
          const remainder = a % b;
          a = b;
          b = remainder;
        }
      
        return a;
    }






    const gcf = get_gcf(num_abs,den_abs)



    if (num_value > 0 && den_value < 0){
        num_value = -num_value
        den_value = -den_value
    }


    const reduced_num = num_value / gcf
    const reduced_den = den_value / gcf





    if (reduced_den === 1 ){
        if (reduced_den === -1){
            console.log("HI")
        }
        return num_to_string(reduced_num / reduced_den)
    }else{
        return fuck_you_string(reduced_num) + "/" + fuck_you_string(reduced_den)
    }


}

function fuck_you_string(a){
    // cause String can use scientific notation >:(
    return num_to_string(a)
}

function num_to_string(number){

    // avoids the issue of small numbers being written in scientific notation when using built in string method
    
    if (String(number) === "Infinity"){throw new EvaluateError("Infinite value found")}

    if (String(number) === "NaN"){
        throw new EvaluateError("undefined value found")
    }

    if (typeof number === "string"){return number}
    // gpt code
    precision_n = 30
    let numberAsString = number.toFixed(precision_n); 
    numberAsString = numberAsString.replace(/\.?0+$/, ''); 
    
    


    return numberAsString
}

function get_num_den(value){

    let num_den

    if (is_fraction(value)){
        
        num_den = value.split("/")
    
    }else{
        num_den = [value,"1"]
    }

    return num_den.map(Number)

}

function evaluate_fraction(value){

    const num_den = get_num_den(value)

    return num_den[0] / num_den[1]

}

function is_decimal(value){
    if (is_fraction(value)){return false}
    return Math.round(Number(value))!==Number(value)

}

function add_numbers(value1, value2){

    if (is_decimal(value1) || is_decimal(value2)){
        return fuck_you_string(evaluate_fraction(value1) + evaluate_fraction(value2))
    }

    const [num1, den1] = get_num_den(value1)
    const [num2, den2] = get_num_den(value2)

    const new_den = den1 * den2

    const new_num1 = new_den / den1 * num1    
    const new_num2 = new_den / den2 * num2

    const new_num = new_num1 + new_num2

    return construct_fraction(new_num, new_den)

}



function multiply_numbers(value1, value2){

    if (is_decimal(value1) || is_decimal(value2)){
        return num_to_string(evaluate_fraction(value1) * evaluate_fraction(value2))
    }

    const [num1, den1] = get_num_den(value1)
    const [num2, den2] = get_num_den(value2)

    const new_den = den1 * den2
    const new_num = num1 * num2

    return construct_fraction(new_num, new_den)


}

function take_exponent(base,exponent){

    /*
    the base and exponent can themselves be fraction, handled immediately (no simplification)
    but they can also be used to construct a fraction
    */

    const base_number = evaluate_fraction(base)

    const exponent_number = evaluate_fraction(exponent)

    const integer_base = Math.round(base_number) === base_number
    const integer_exponent = Math.round(exponent_number) === exponent_number

    const both_integers = integer_base && integer_exponent

    const write_fraction = both_integers && exponent_number < 0


    

    if (write_fraction){
        //E

        const inverted_value = base_number ** -exponent_number

        return construct_fraction("1", fuck_you_string(inverted_value))
    }



    return num_to_string(base_number ** exponent_number)

}

function take_trig_func(trig_func,value){

    const evaluated_value = fuck_you_string(evaluate_fraction(value))

    const expression = trig_func + evaluated_value + ")" 
    //RAD
    const expression_degree = rad_to_deg(expression)
    const result = math.evaluate(expression_degree)

    if (Math.abs(result.im) > 10 ** -8){
        throw new EvaluateError("trig function evaluated outside of domain")
    }

    return num_to_string(result)    
}

function get_exponent(tree){
    return tree.terms[1]
}

function get_coefficient(tree){
    const coeffs = tree.terms.filter(is_number)

    if (coeffs.length === 0){
        return "1"
    }else if (coeffs.length === 1){
        return coeffs[0]
    }else{
        throw "should have already been simplified"
    }    
}

function get_base(tree){
    return [tree.terms[0]]
}

function get_common_product_terms(tree){
    return tree.terms.filter(term=>{return !is_number(term)})
}

function is_tree(term){


    const keys = Object.keys(term).filter(key=>{return key !== "inverted" && key !== "has_solve_var"}).sort()      // when constructing the tree it adds an inverted property, so i just filter it out5
    const correct_keys = ["op", "terms"]
    
    return keys.every((_,idx)=>{return keys[idx] === correct_keys[idx]})
    
} 

function is_number(term){

    if (typeof term !== "string" && !is_tree(term)){
        throw "must only check a string or a tree"
    }

    if (is_tree(term)){return false}

    const is_single_value = !isNaN(Number(term))

    return is_fraction(term) || is_single_value
}

function is_fraction(term){


    if (typeof term !== "string" && !is_tree(term)){
        throw "must only check a string or a tree"
    }

    if (is_tree(term)){return false}

    const num_den = term.split("/")

    if (num_den.length !== 2){return false}


    const num = num_den[0]
    const den = num_den[1]


    return !isNaN(Number(num)) && !isNaN(Number(den))

}

//#endregion



//#region equation --> tree


function eqn_to_tree(eqn, do_simplification = true){

    eqn = eqn.replaceAll(" ","")

    const eqn_sides = eqn.split("=")


    const trees = eqn_sides.map(expression => {


        const items = split_expression_txt(expression)

        let tree = search_down_eqn(items)


        correct_op_order(tree)

        // TODO i've given up, obviously this shouldnt be in a while loop but i cant figure out how to deal with nested parentheses so screw it ):

        let old_tree_txt
        let new_tree_txt = "something different, ive given up writing good code :)"

        while (old_tree_txt !== new_tree_txt){
            old_tree_txt = JSON.stringify(tree)
            tree = remove_parens(tree)
            new_tree_txt = JSON.stringify(tree)

        }

        
        remove_sqrt(tree)
    
        remove_inverse_op(tree)
    

        return tree

    })


    let combined_tree
    if (trees.length === 1){
        // case of an expression (no equal signs, so splits into one element)
        combined_tree = trees[0]
    }else{
        const tree1 = trees[0]
        const tree2 = {
            op: "*",
            terms:[
                trees[1], "-1"
            ]
        }
        combined_tree = {op: "+", terms: [tree1, tree2]}
    }

    if (do_simplification){
        return simplify_tree(combined_tree)
    }else{
        return combined_tree
    }
    

    function search_down_eqn(items){


        const tree = {}

        tree.terms = []



        if (items.length === 1){

            const item = items[0]




            const open_idx = item.indexOf("(")+1
            const opener = item.slice(0,open_idx)

            const closer = item[item.length-1]

            const open_paren = unitary_ops.includes(opener)
            const closed_paren = closer===")"
            
            if (open_paren!==closed_paren){
                throw "shouldnt happen "+item
            }
            const enclosed_paren = open_paren

            if (enclosed_paren){

                tree.op = opener

                const paren_stripped = item.slice(open_idx,item.length-1)

                const inner_items = split_expression_txt(paren_stripped)
                tree.terms[0] = search_down_eqn(inner_items,tree)

                return tree
            }else{
                return item
            }

        }


        const first_op_idx = items.findIndex(char=>arithmetic_ops.includes(char))

        if (first_op_idx === -1){
            throw new FormatError("must have operations between parentheses and numbers/variables")
        }

        const term1 = items.slice(0,first_op_idx)
        const term2 = items.slice(first_op_idx+1)

        if (term1.length === 0 || term2.length === 0){
            throw new FormatError("equation contains syntax error")
        }

        const op_char = items[first_op_idx]

        tree.op = op_char


        tree.terms[0] = search_down_eqn(term1,tree)
        tree.terms[1] = search_down_eqn(term2,tree)


        return tree
    }





}


function split_by_ops(expression){

    // pipe is for visuals
    const ops = "|+-*/()^={} " // the blank space at the end is critical, "\\cdot b" --> "\\cdot"," ","b"


    let items = []
    let item = ""
    for (char of expression){
        if (ops.includes(char)){
            if (item !== ""){
                items.push(item)
            }
            items.push(char)
            item = ""
        }else{
            item += char
        }
    }


    items.push(item)
    
    return items
}

function split_expression_txt(expression){
    // splits it into numbers, variables, operations and parentheses groups

    if (expression[0]==="-"){
        expression = "0"+expression   // removes unitary minus
    }


    let items = split_by_ops(expression)



    const unitary_op_idxs = []
    items.forEach((item,idx)=>{
        if (unitary_ops.includes(item+"(")){
            unitary_op_idxs.push(idx)
        }
    })


    unitary_op_idxs.forEach(idx=>{
        items[idx] = items[idx]+"("
        items[idx+1] = ""
    })

    items = items.filter((item)=>{return item !== ""})

    var grouped_items = []
    

    var paren_term = ""

    var in_paren = false

    var paren_layer = 0

    items.forEach(item=>{
        if (in_paren){

            paren_term+=item

            if (unitary_ops.includes(item)){
                paren_layer+=1
            }else if (item===")"){
                paren_layer-=1
            }

            if (paren_layer<-1){
                throw "shouldnt happen"
            }
            if (paren_layer===-1){
                in_paren = false
                grouped_items.push(paren_term)
                paren_term = ""
                paren_layer = 0
            }

        }else{    
            if (unitary_ops.includes(item)){
                in_paren = true
                paren_term += item
            }else if (item===")"){
                throw "this shouldnt happen"
            }else{
                grouped_items.push(item)
            }
        }
    })



    return grouped_items
}

function correct_op_order(tree){

    // corrects operation order from initial construction e.g. a*b+c
    // mutates tree instead of returning


    let tree_changed = true
    

    while (tree_changed){
        const old_tree = JSON.stringify(tree)
        step_down_tree(tree)
        const new_tree = JSON.stringify(tree)

        tree_changed = old_tree !== new_tree
    }

    step_down_tree(tree)

    function step_down_tree(tree){

        if (typeof tree === "string"){return}

        // for this function, swapping terms could then interfere with lower terms
        // so i think i have to iterate over until there's no changes




        tree.terms.forEach(step_down_tree)


        const op_upper = tree.op

        if (unitary_ops.includes(op_upper)){return}

        const op_lower = tree.terms[1].op // the way i constructed the tree, the operations would only be on the second node

        if (unitary_ops.includes(op_lower)){return }

        if (op_lower===undefined){return }



        const upper_priority = op_priority(op_upper)
        const lower_priority = op_priority(op_lower)

        const greater_priority = upper_priority > lower_priority

        const how_order_of_ops_work = upper_priority === lower_priority && op_lower !== "^"


        if (greater_priority || how_order_of_ops_work){
            
            // also flip for equal to, why?
                // i read left to right, meaning later has higher priority, e.g a+(b+c)
                // in addition and subtraction, earlier has higher priorirty, e.g (a+b)+c
                // therefore, i always need to reverse the order
                // same for a/b/c, should be (a/b)/c
                // a^b^c is a^(b^c) though
            
            const a = tree.terms[0]
            const b = tree.terms[1].terms[0]
            const c = tree.terms[1].terms[1]

            tree.op = op_lower


            const new_sub_tree = {}

            new_sub_tree.op = op_upper

            new_sub_tree.terms = []

            new_sub_tree.terms[0] = a
            new_sub_tree.terms[1] = b


            tree.terms = []
            tree.terms[0] = new_sub_tree
            tree.terms[1] = c

        }

    }

}

function remove_parens(tree, parent){
    if (typeof tree === "string"){return tree}

    if (tree.op === paren_op){
        
        const lower_term = tree.terms[0].terms
        if (lower_term === undefined){

            if (parent === undefined){
                //tree = tree.terms[0]

                return tree.terms[0]
                throw "this is probably where its just a single variable wrapped in parentheses"

            }

            const new_parent_terms = parent.terms.map(term=>{
                if (term === tree){
                    return tree.terms[0]
                }else{
                    return term
                }
            })

            parent.terms = new_parent_terms
        }else{
            tree.op = tree.terms[0].op
            tree.terms = lower_term
        }
    }

    tree.terms.forEach((term)=>{remove_parens(term,tree)})
    return tree
}

function remove_sqrt(tree){
    if (typeof tree === "string"){return}

    if (tree.op === sqrt_op){
        tree.op = "^"
        tree.terms = [tree.terms[0], "1/2"]
    }

    tree.terms.forEach(remove_sqrt)
}

function remove_inverse_op(tree){


    if (typeof tree === "string"){return}

    if (["-","/"].includes(tree.op)){


        tree.op = inverse_op[tree.op]

        const invert_term = tree.terms[1]

        let new_sub_tree

        if (invert_term.op === tree.op){ // tree.op after inverting!!

            const expanded_terms = invert_term.terms.map(term=>{
                return {
                    op: upper_op[tree.op],
                    terms: [
                        term,
                        "-1"
                    ]
                }
            })

            new_sub_tree = {
                op: tree.op,
                terms: expanded_terms
            }
                
        }else{

            new_sub_tree = {
                op: upper_op[tree.op],
                terms:[
                    invert_term,
                    "-1"
                ],
            }
    
        }

        
        tree.terms[1] = new_sub_tree
    }

    tree.terms.forEach(remove_inverse_op)

}




//#endregion



//#region simplify tree

function simplify_tree(tree0, parent){

    //! update_parent mutates tree0 as well
        // doesnt matter right now, but it might be an issue

    if (typeof tree0 === "string"){return tree0}




    tree0.terms.forEach((term)=>{simplify_tree(term, tree0)})
    
    
    const tree = remove_duplicates(tree0)

    const factorable_op = ["+","*"].includes(tree.op) 
    let new_tree
    if (factorable_op){

        let get_coefficient_or_exponent, get_common_terms
        if (tree.op === "+"){
            get_coefficient_or_exponent = get_coefficient
            get_common_terms = get_common_product_terms
        }else{
            get_coefficient_or_exponent = get_exponent
            get_common_terms = get_base
        }


        const tree_sub_op = upper_op[tree.op]  // for 3*a + 4*a,    treeSubOp would be "*"

        const sub_terms = tree.terms.map(term=>{
            if (term.op === tree_sub_op){
                return term
            }else if (tree_sub_op === "*"){
                return {
                    op: tree_sub_op,
                    terms: [term]
                }
            }else if (tree_sub_op === "^"){
                return {
                    op: tree_sub_op,
                    terms: [term,"1"]   
                }
            }else{
                throw "that should be all cases"
            }
        })


        function already_added(term){return grouped_sub_terms.flat().includes(term)}

        const grouped_sub_terms = []
        sub_terms.forEach(term1=>{
            if (already_added(term1)){return}
            const sub_term_group = [term1]
            grouped_sub_terms.push(sub_term_group)
            sub_terms.forEach(term2=>{ 
                if (already_added(term2)){return}
                const common_subterms1 = get_common_terms(term1)
                const common_subterms2 = get_common_terms(term2)
                if (all_terms_equal(common_subterms1,common_subterms2)){
                    sub_term_group.push(term2)
                }
            })
        })

        new_terms = grouped_sub_terms.map(group=>{
            
            const coefficients_or_exponents = group.map(get_coefficient_or_exponent)

            let combined_value
            if (tree.op === "*"){
                const exponent_tree = {op: "+", terms: coefficients_or_exponents.concat("0")}   // need to have two terms to simplify the tree
                combined_value = simplify_tree(exponent_tree)   // need to simplify tree instead of arithmetic since the exponents can be variables/expressions
            }else if (tree.op === "+"){
                const coefficient_tree = {op: "+", terms: coefficients_or_exponents}
                combined_value = simplify_arithmetic(coefficient_tree)                  // simplifyTree would lead to infinite recursion
            }else{``
                throw "should be one of those two operations"
            }
            
            const common_terms = get_common_terms(group[0])  // all terms should have the same common term, so can just index the first one      

            const new_sub_tree = {op: tree_sub_op, terms: [common_terms,combined_value].flat()}     // merges the b term with the 0 term
            const simplified_tree = simplify_arithmetic(new_sub_tree)    // 0*b --> 0   or 1*b --> b     (unless it's times or to the power of 0 or times 1, the simplified tree is the same as the original)
            
            return simplified_tree
        })

        if (new_terms.length === 1){
            new_tree = new_terms[0]
        }else{
            new_tree = {op: tree.op, terms: new_terms}
        }

    }else{
        new_tree = tree
    }

    const simplified_tree = simplify_arithmetic(new_tree)

    if (parent === undefined){
        // this only happens on the top node
        return simplified_tree
    }else{
        update_parent(tree0,parent,simplified_tree)
    }

    /*

    it's a weird thing how i branch and either mutate the tree or return the tree

    would want to be more consistent

    always return the tree
        wouldn't work since the parent would lose access to it higher up the recursion

    always mutate
        i think this would work

    
    i think once i see how simplifying the tree fits into the rest of the solver, ill know what to do

    i would definitely have to create a deep clone somewhere, so it's just a question of whether to do it here, or somewhere outside

    if i create a deep clone, i obviously dont have to worry about side effects

    i could potentially deep clone in this function but either
        i would deep clone on every recursion which would be unnecessary and kind of weird
            it would work though as long as i keep access to the original tree0 for updateParent
        i would have an outer function deep cloning which calls an inner recursive function

    i could also make it purely mutate
        removeDuplicates would mutate instead of reassigning
        then i wouldnt need updateParent
        this might be the cleanest most consistent way of doing it

    i dont have to worry about this now though, just making sure i understand whats going on


    */
    
}

function simplify_arithmetic(tree){

    if (typeof tree === "string"){return tree}

    if (tree.op === "*" && tree.terms.includes("0")){   // a*0 --> 0
        return "0"
    }

    
    if (tree.op === "^" && tree.terms[0] === "0" && Number(tree.terms[1]) <= 0){
        throw new EvaluateError("cannot raise 0 to a negative exponent")
    }
    

    if (tree.op === "^" && tree.terms[1] === "0"){      // a^0 --> 1
        return "1"
    }

    if (tree.op === "^" && tree.terms[1] === "1"){      // a^1 --> a
        return tree.terms[0]
    }

    if (tree.op === "^" && tree.terms[0] === "0"){      // 0^a --> 0
        return "0"
    }

    if (tree.op === "^" && tree.terms[0] === "1"){      // 1^a --> 1
        return "1"
    }


    if (tree.op === "^"){
        if (tree.terms.every(is_number)){
            const new_value = take_exponent(tree.terms[0], tree.terms[1])
            if (isNaN(new_value) && !is_fraction(new_value)){
                throw new EvaluateError("imaginary value found")
            }
            return num_to_string(new_value)
        }else if (tree.op === tree.terms[0].op){ // (a^b)^c --> a^(b*c)
            const a = tree.terms[0].terms[0]
            const b = tree.terms[0].terms[1]
            const c = tree.terms[1]
            const new_prod_tree = {op: "*", terms: [b, c]}
            const new_tree = {op: "^", terms: [a, new_prod_tree]} // (a^b)^(3*b) --> (a)^(b*(b*3)) exponent than needs to be tree simplified
            return simplify_tree(new_tree) // need to simplify the tree itself cause it could end up with a^0 or a^1
        }else if (tree.terms[0].op === "*"){                     // (a*b*d*f)^c --> a^c*b^c*d^c*f^c etc...
            
            // (-1*f)^(1/2) should NOT return an error
            // basically just dont expand it IF the 
                // negative coefficient AND
                // fractional exponent


            

            const exponent = tree.terms[1]
            const common_terms = tree.terms[0].terms

            const num_coeff = common_terms.filter(is_number)



            const non_int_exponent = is_fraction(exponent) || is_decimal(exponent)



            const could_contain_complex =  non_int_exponent

            

            if (could_contain_complex){return tree}


            const product_terms = common_terms.map(term=>{
                return {op: "^", terms: [term,exponent]}
            })

            const new_tree = {op: "*", terms: product_terms}
            
            
            return new_tree
            return simplify_tree(new_tree)  //! had it simplify before, but i dont think this is needed

        }else{
            return tree
        }
    }


    if (flatten_ops.includes(tree.op)){

        const numbers = tree.terms.filter(is_number)
        const non_number_terms = tree.terms.filter(term => {return !numbers.includes(term)})

        const op_func = cumulative_ops[tree.op]
        let value = cum_init_values[tree.op]

        numbers.forEach(term=>{
            value = op_func(value,term)
        })
        const final_value = fuck_you_string(value)


        const are_all_numbers = tree.terms.every(is_number)

        const remove_numbers = tree.op === "+" && final_value === "0" || tree.op === "*" && final_value ===  "1" 
            

        const single_var = remove_numbers && non_number_terms.length === 1
        
        let new_tree
        if (are_all_numbers){
            new_tree = final_value
        }else if (single_var){
            new_tree = non_number_terms[0]
        }else if (remove_numbers){
            const new_terms = non_number_terms
            new_tree = {op: tree.op, terms: new_terms}
        }else{
            const new_terms = [non_number_terms,final_value].flat()
            new_tree = {op: tree.op, terms: new_terms}
        }
        return new_tree

    }else if(trig_func_ops.includes(tree.op)){
        
        if (is_number(tree.terms[0])){
            return take_trig_func(tree.op, tree.terms[0])
        }


        const inner_trig_op = tree.terms[0].op
        


        const trig_op = tree.op


        const is_inverse = inverse_trig_op_map[trig_op] === inner_trig_op

        if (is_inverse){
            return tree.terms[0].terms[0]
        }

        return tree
    }

    throw "all cases should have been handled"
}

function remove_duplicates(tree){
    // NOT RECURSIVE
    // AGAIN RETURNS DOESNT MUTATE (could do it by mutating though)


    
    if (tree.terms.length === 1){
        
        if (trig_func_ops.includes(tree.op)){
            return tree
        }else{
            throw "i thought this case would no longer occur with how i simplify arithmetic"

        }
        // return {op: tree.op, terms: tree.terms[0].terms}

    }


    const is_flattable_op = ["+","*"].includes(tree.op)

    if (!is_flattable_op){return tree}

    const new_terms = tree.terms.map(subtree=>{
        if (typeof subtree !== "string" && tree.op === subtree.op){
            return subtree.terms
        }else{
            return subtree
        }
    }).flat()

    const new_tree = {op: tree.op, terms: new_terms, has_solve_var: tree.has_solve_var}

    return new_tree
}




//#endregion




//#region solving


function is_near_zero(value){
    return Math.abs(Number(value)) < 10**(-5)
}

function solve_for(unmerged_tree, variable){



    if (variable === undefined){
        throw "need to specify the variable to solve for"
    }



    if (unmerged_tree === variable){
        return "0"
    }


    const tree = combine_solve_term(unmerged_tree, variable)


    // TODO i have a similar check in trim trees, seems redundant
    // a+((a+1)*(-1)) cant be simplified to give -1, but becomes -1 when combining solve terms
    if (!isNaN(tree) && !is_near_zero(tree)){
        throw new ContradictionError
    }

    const lineage = [] 

    find_lineage(tree)


    function find_lineage(tree, parent){

        if (tree === variable){
            lineage.push(parent)
        }

        if (typeof tree === "string"){
            return
        }
    
        tree.terms.forEach((term)=>{find_lineage(term,tree)})
    
        if (lineage.includes(tree) && parent !== undefined ){
            lineage.push(parent)
        }

    }


    
    const solve_var_factored_out = lineage.length === 0
    
    if (solve_var_factored_out){
        throw new VariableEliminatedError(tree, "variable eliminated")
    }






    // const inverted_branches = []

    const inverted_tree = {
        op: "boop",     // then just make the final inverted tree the terms of this tree (should only be one term)
        terms: []   
    }

    let sub_inverted_tree = inverted_tree


    for (let i = 0; i < lineage.length; i++){


        const tree = lineage[i]


        let child
        if (i === 0){
            child = variable
        }else{
            child = lineage[i-1]
        }


        if (tree.op === "^" && tree.terms[1] === child){
            throw new CantSymbolicSolve("cant solve for variable in an exponent")
        }

        siblings = tree.terms.filter(term => {return term !== child})


        const no_siblings = siblings.length === 0
        const is_trig_op = trig_func_ops.includes(tree.op)

        if (no_siblings !== is_trig_op){
            throw "should have no siblings if and only if it's a trig function"
        }

        let outer_inverse_op
        if (is_trig_op){
            outer_inverse_op = inverse_trig_op_map[tree.op]
        }else{
            outer_inverse_op = tree.op
        }

        const invert_term_ops = {
            "+": "*",
            "*": "^",
            "^": "^"
        }


        let inverted_terms
        inverted_terms = siblings.map(sibling => {


            return {
                op: invert_term_ops[tree.op],
                terms: [sibling, "-1"]
            }

        })


        const outermost = i + 1 === lineage.length

        
        if (outermost){
            inverted_terms.unshift("0")
        }
        

        const inverted_branch = {
            op: outer_inverse_op,
            terms: inverted_terms
        }    // this condition also works for trig functions :)  terms will be empty but will added to in the following iteration

        // const only_one_innermost_sibling = inverted_siblings.length === 1 && (i + 1 === lineage.length)


        sub_inverted_tree.terms.unshift(inverted_branch)    // need to add it to the beginning (instead of end) cause of exponents

        sub_inverted_tree = inverted_branch


    }


    const n_terms = inverted_tree.terms.length
    let deboopified_inverted_tree   // these naming skills

    if (n_terms === 0){
        // TODO very ugly that i'm handling this case
        // for a*(b-3)=0 when solving for a, the lineage is empty
        console.warn("this should only be happening when there's a product split")
        deboopified_inverted_tree = "0"
    }else if (n_terms === 1){
        deboopified_inverted_tree = inverted_tree.terms[0]
    }else{
        throw "should have had only one term on the top???"
    }
            


    const simplified_tree = simplify_tree(deboopified_inverted_tree)

    return simplified_tree



}

//const test_tree = {op:"+",terms:["b","b"]}

const test_it = eqn => {

    const test_tree = eqn_to_tree(eqn)

    const grouped = group_common_terms(test_tree)
    
    console.log(tree_to_expression(grouped))
    
}



function remove_top_ops(tree){

    if (typeof tree === "string"){
        return tree
    }

    if (tree.op === "*" || tree.op === "+"){
        return tree
    }
    
    if (tree.op === "^"){
        if (Number(tree.terms[1])<0){
            throw new EvaluateError("infinite value found")
        }
        return remove_top_ops(tree.terms[0])
    }
    
    // trig function, cause im not doing logarithms yet ):
    const trig_op = tree.op
    const inverse_trig_op = inverse_trig_op_map[trig_op]
    const expression = `${inverse_trig_op}0)`
    const result = math.evaluate(expression)

    if (result === Infinity){
        throw new EvaluateError("infinite value found")
    }

    const inverse_result = num_to_string(-result)

    const new_tree = {op:"+",terms:[tree.terms[0],inverse_result]}

    return remove_top_ops(simplify_tree(new_tree))

}





function group_common_terms(tree1, top = true){


    // not sure if it's needed, just
    
    let tree = JSON.parse(JSON.stringify(tree1))
    let tree2 = tree1

    if (top){
        tree = remove_top_ops(tree)
    }


    if (tree.op === "+" || tree.op === "*" ){
        const new_terms = tree.terms.map(term => {return group_common_terms(term, false)})
        tree = {op: tree.op, terms: new_terms}
    }

    if (tree.op === "*"){

        const flat_terms = tree.terms.map(term => {
            if (term.op === "*"){
                return term.terms
            }else{
                return term
            }
        }).flat()

        tree = {op: "*", terms: flat_terms}

    }


    if (tree.op === "+"){


        tree = do_stuff(tree)


    }

    if (JSON.stringify(tree1)!==JSON.stringify(tree2)){
        throw "MUTATED O:"
    }
    return tree 

}








function do_stuff(tree){

 


    
    const product_terms = tree.terms.map(term => {
        let subterms
        if (term.op === "*"){
            subterms = term.terms
        }else{
            subterms = [term]
        }
        
        return subterms
    })


    const possible_matches = get_permutations(product_terms)

    const common_terms = []

    possible_matches.forEach(terms => {
        

        const ref_term = terms[0]


        for (let idx=0; idx<terms.length; idx++) {

            const term = terms[idx]

            if (is_number(term)){
                return
            }

            // just for efficiency, doesn't need to check terms that have already been removed
            const unremoved_terms = product_terms[idx]
            if (!unremoved_terms.includes(term)){
                return
            }

            if (idx === 0){continue}

            const match = all_terms_equal([ref_term], [term])
            
            if (!match){return}
        }


        terms.forEach((term,prod_idx) => {
            const product_term = product_terms[prod_idx]
            const match_idx = product_term.indexOf(term)
            product_term.splice(match_idx,1)
        })

        common_terms.push(terms[0])
    })
    
    if (common_terms.length === 0){
        return tree
    }
    
    const uncommon_terms = []
    
    product_terms.forEach(terms => {
        if (terms.length === 0){
            uncommon_terms.push("1")
        }else if (terms.length === 1){
            uncommon_terms.push(terms[0])
        }else{
            uncommon_terms.push({op:"*",terms:terms})
        }
    })
    


    let uncommon_tree
    if (uncommon_terms.length === 0){
        throw "i dont think can all be common O:"
    }else if (uncommon_terms.length === 1){
        uncommon_tree = uncommon_terms[0]
    }else{
        uncommon_tree = {op: "+", terms: uncommon_terms}
    }
    
    const new_terms = [uncommon_tree].concat(common_terms)

    return {op: "*", terms: new_terms}

}

function combine_solve_term(tree, solve_var, parent){


    // combination of factoring and expanding to get the variable to solve for in one place
    // would be called at the beginning of solve for (right after converting to tree)

    // just mutate?


    if (typeof tree == "string"){
        return tree
    }


    tree.terms.forEach(term => {combine_solve_term(term, solve_var, tree)})

    function solve_var_in_term (term){
        return term.has_solve_var || term === solve_var
    }


    if (tree.terms.some(solve_var_in_term)){
        tree.has_solve_var = true
    }else{return tree}


    const solve_var_terms = tree.terms.filter(solve_var_in_term)

    if (solve_var_terms.length > 0){
        tree.has_solve_var = true
    }

    const multiple_solve_vars = solve_var_terms.length > 1

    if (multiple_solve_vars && tree.op !== "+"){
        

        throw new CantSymbolicSolve("cant merge, not addition")
    }

    let new_tree
    if (multiple_solve_vars && tree.op === "+"){
        
        const sum_children = tree.terms.map(subterm => {

            if (solve_var_in_term(subterm) && subterm.op !== "*"){
                return {op: "*", terms: [subterm, "1"], has_solve_var: true}
            }else{
                return subterm
            }
        })


        const expanded_sum_children = sum_children.map(subtree => {

            if (solve_var_in_term(subtree)){
                return expand(subtree)  //! simplify each of the product terms
            }else{
                return subtree
            }

        }).flat()


       //  const simplified_sum_children = simplify_tree({op: "+", terms: expanded_sum_children}).terms
        //! simplify the sum of the children

        //! sort of works (avoids requiring recursive simplification, but tricky situation if it simplifies to a string)


        const factorable_terms = expanded_sum_children.filter(subterm => {
            return subterm.op === "*" && solve_var_in_term(subterm)
        })
        const nonfactorable_terms = expanded_sum_children.filter(subterm => {
            return !(factorable_terms.includes(subterm))
        })

        const common_terms = factorable_terms.map(subterm => {  
            const terms_with_solve_var = subterm.terms.filter(grandchild => {
                return solve_var_in_term(grandchild)
            })
            if (terms_with_solve_var.length > 1){
                throw "this shouldnt happen, should have either thrown an error or been factored out before"
            }else if (terms_with_solve_var.length === 0){
                throw "should have been filtered out of factorable terms"
            }
            return terms_with_solve_var[0]
        })


        const matching_terms = common_terms.every(term => {
            return all_terms_equal([term], [common_terms[0]])

        })

        //const matching_terms = all_terms_equal(common_terms)

        if (!matching_terms){
            delete_solve_props(tree)
            throw new CantSymbolicSolve("cant merge")
        }

        const common_term = common_terms[0]



        const other_factor_trees = factorable_terms.map((subterm,idx) => {
            const boop = subterm.terms.filter(grandchild => {
                return common_terms[idx] !== grandchild
            })

            if (boop.length === 0){
                throw "should at least be solveVar * 1, this shouldnt happen"
            }else if (boop.length === 1){
                return boop[0]
            }else{
                return {op: "*", terms: boop}
            }
        })

        let factored_out_tree
        if (other_factor_trees.length === 0){
            throw "not sure if this is possible"
        }else if (other_factor_trees.length === 1){
            factored_out_tree = other_factor_trees[0]
        }else{
            factored_out_tree = {
                op: "+",
                terms: other_factor_trees
            }
        }
        

        const factored_term = {
            op: "*",
            terms: [common_term, factored_out_tree]
        }
        

        const combined_terms = nonfactorable_terms.concat(factored_term)

        let expanded_tree
        if (combined_terms.length === 1){
            expanded_tree = combined_terms[0]
        }else{
            expanded_tree = {op: "+", terms: combined_terms}
        }

        //new_tree = expanded_tree
        new_tree = simplify_tree(expanded_tree) //! simplifyTree also mutates

        new_tree.has_solve_var = true

    }else{
        new_tree = tree
    }   

    if (parent === undefined){
        delete_solve_props(new_tree)
        return new_tree
    }else{
        update_parent(tree, parent, new_tree)
    }



    function expand(tree, parent){

    
        if (typeof tree === "string"){
            return
        }
        
        tree.terms.forEach(term => {expand(term, tree)})

        if (tree.op !== "*"){
            
            if (tree.op === "+"){
                update_parent(tree, parent, remove_duplicates(tree))
            }

            return  // still need to recurse downward if it's not multiplication, BUT shouldn't be doing any expanding  
        }



        const all_sum_terms = tree.terms.map(tree => {
    
    
            let sum_terms
            if (tree.op === "+"){
                sum_terms = tree.terms
            }else{
                sum_terms = [tree]
            }
    
            return sum_terms
    
        })
    
    
        const nested_expanded_terms = get_permutations(all_sum_terms)
    
        const product_terms = nested_expanded_terms.map(terms => {


            const product_term = remove_duplicates({op: "*", terms: terms})

            product_term.has_solve_var = terms.some(solve_var_in_term)

            return product_term

        })
        

        if (parent === undefined){
            return product_terms
        }else{

            let new_tree
            if (product_terms.length === 1){
                new_tree = product_terms[0]
            }else{
                new_tree = {op: "+", terms: product_terms}
            }

            update_parent(tree, parent, new_tree)
        }
    
                                                
    }
    

    function delete_solve_props(tree){

        if (typeof tree === "string"){return}
        delete tree.has_solve_var
        tree.terms.forEach(term =>{delete_solve_props(term)})
    }
}

function get_permutations(array_of_arrays){

    let combos = [[]]


    for (const sub_array of array_of_arrays){
        combos = expand_combos(sub_array, combos)
    }
    return combos

    function expand_combos(sub_array, combos){

        const new_combos = []
        for (const el of sub_array){
            for (const combo of combos){
                new_combos.push(combo.concat(el))
            }
        }
        return new_combos
    }

}

function sub_in(tree, variable, solve_tree, parent){


    // substituting solveTree into tree for variable
    // so it has









    if (tree === variable){
        if (parent){
            update_parent(tree, parent, solve_tree)
        }else{
            return solve_tree
        }
        
    }


    if (typeof tree === "string"){
        return
    }

    tree.terms.forEach(term => {sub_in(term, variable, solve_tree, tree)})

    if (parent === undefined){
        const simplified_tree = simplify_tree(tree)
        return simplified_tree
    }
}


class EvaluateError extends Error {
    // used for sqrt(-1) 0/0 
    constructor(message){
        super(message)
    }
}


class CantSymbolicSolve extends Error {
    // a+a^2 (cant solve for a)
    constructor (message){
        super(message)
    }
}

class VariableEliminatedError extends Error {
    // a*(b+c)-a*b-a*c --> 0 (a is lost)
    constructor (remaining_tree, message){
        super(message)
        this.remaining_tree = remaining_tree
    }
}


//#endregion



//#region tree --> equation


function tree_to_eqn(tree, use_ltx = false, parent){


    let expression_trees

    if (tree.op === "+"){


        const left_terms = []
        const right_terms = []

        tree.terms.forEach(term => {



            if (Number(term) < 0){
                right_terms.push(fuck_you_string(-Number(term)))
                return
            }else if (typeof term === "string" && term[0] === "-"){
                right_terms.push(term.slice(1,Infinity))
                return 
            }

            if (term.op !== "*"){
                left_terms.push(term)
                return
            }


            const copied_term = JSON.parse(JSON.stringify(term))

            const subterms = copied_term.terms
            const coefficient = subterms[subterms.length-1] 
    
            if (coefficient[0]==="-"){  // could also be fraction
                const pos_coefficient = coefficient.slice(1)


                if (pos_coefficient === "1" && subterms.length === 2){  // this just prevents unneeded parentheses
                    right_terms.push(term.terms[0])
                }else{
                    subterms[subterms.length -1] = pos_coefficient
                    right_terms.push(copied_term)
                }
            }else{
                left_terms.push(copied_term)
            }
        })
    
        const expression_terms = [left_terms, right_terms]
    
        expression_trees = expression_terms.map(terms => {
            if (terms.length === 0){
                return "0"
            }else if (terms.length === 1){
                return terms[0]
            }else{
                return {op: "+", terms: terms}
            }
        })
    
    }else{
        expression_trees = [tree, "0"]
    }
    

    const expressions = expression_trees.map(tree => {return tree_to_expression(tree, use_ltx)})


    let eqn = expressions[0] + "=" + expressions[1]


    return eqn
}


// const ohnotree = '{"op":"*","terms":[{"op":"^","terms":[{"op":"^","terms":[{"op":"*","terms":[{"op":"^","terms":["y","-1"]},"1.990049751243781361864648715709"]},"1.5"]},"-1"]},{"op":"^","terms":[{"op":"^","terms":["y","-1"]},"-1"]},{"op":"^","terms":["0.995024875621890680932324357855","-1"]}]}'

// const fuck = JSON.parse(ohnotree)

// tree_to_expression(fuck)

function tree_to_expression(tree, use_ltx, parent){

    if (typeof tree === "string"){return format_fraction(tree)}


    const tree_clone = JSON.parse(JSON.stringify(tree)) //! ): have to do it cause merging fraction mutates tree 
    tree = merge_fraction_products(tree_clone)
    


    function format_fraction(txt){

        if (!use_ltx || !is_fraction(txt)){
            return txt
        }

        const num_den = txt.split("/")
        return `\\frac{${num_den[0]}}{${num_den[1]}}`


    }

    const terms = tree.terms.map(term=>{
        
        let sub_txt

        if (typeof term === "string"){
            sub_txt = format_fraction(term)

            if (tree.op === "^" && is_fraction(term)){
                sub_txt = "("+sub_txt+")"   // cannot be moved to the need_parens conditional since it's just a string
            }


        }else{
            sub_txt = tree_to_expression(term, use_ltx, tree)
        }
        
        return sub_txt
    })


    let txt 


    if (tree.op === "/"){
        const num = terms[0]
        const den = terms[1]
        if (use_ltx){

            txt = `\\frac{${num}}{${den}}`

        }else{
            txt = `${num}/${den}`
        }

    }else if (tree.op === "^"){

        const base = terms[0]
        const exponent = terms[1]

        if (use_ltx){
            txt = base + "^{" + exponent + "}"
        }else{
            txt = base + "^" + exponent
        }


    }else if (unitary_ops.includes(tree.op)){
        
        const operand = terms[0]
        let operation = tree.op
        if (use_ltx){
            operation = "\\"+operation
        }
        return operation + operand +")"

    }else if (Object.keys(cumulative_ops).includes(tree.op)){

        let op_txt
        if (tree.op === "*" && use_ltx){
            op_txt = "\\cdot "
        }else{
            op_txt = tree.op
        }

        const coeffs = terms.filter(is_number)
        const non_coeffs = terms.filter(term => {return !is_number(term)})

        if (coeffs.length > 1){
            // console.warn("there should only be one coefficient, only OK if tree not simplified")
        }

        let rearranged_terms
        if (tree.op === "+"){
            rearranged_terms = terms    // doesn't rearrange addition and subtraction
        }else if (tree.op === "*"){
            rearranged_terms = coeffs.concat(non_coeffs)
        }else{
            throw "there shouldn't be any other cumulative operation"
        }
        

        txt = rearranged_terms.map((term,idx)=>{
            if (idx===0){
                return term
            }else{
                return op_txt+term
            }
        })

        txt = txt.join("")

    }else{
        throw "all operations should have been handled"
    }

    let need_parens

    const is_first_term = parent !== undefined &&JSON.stringify(parent.terms[0])===JSON.stringify(tree)

    
    if (parent === undefined){
        need_parens = false
    }else if(parent.op === "^" && use_ltx && !is_first_term){
        need_parens = false
    }else if (parent.op === "/" && use_ltx){
        need_parens = false
    }else if (parent.op === "/" && tree.terms.length === 1){
        need_parens = false
    }else if(trig_func_ops.includes(parent.op) || trig_func_ops.includes(tree.op)){
        need_parens = false
    }else{

        const upper_priority = op_priority(parent.op)
        const lower_priority = op_priority(tree.op)
    
        

        if (parent.op === "/" && tree.op === "/"){
            console.warn("I RECENTLY CHANGED THIS TO FIX DIVIDE ORDER OF OPS, MAKE SURE NOTHING'S BLOWING UP")
            need_parens = true
        }else{
            need_parens = upper_priority>lower_priority
        }
    }

    if (need_parens){
        txt = "("+txt+")"
    }


    const unitary_times = /(?<=[^a-zA-Z0-9_])1\*/g

    
    const start_unitary_times = /^1\*/g

    const ltx_unitary_times = /(?<=[^a-zA-Z0-9_])1\\cdot/g

    
    const start_ltx_unitary_times = /^1\\cdot/g


    txt = txt.replace(unitary_times,"").replace(ltx_unitary_times,"")
    txt = txt.replace(start_unitary_times,"").replace(start_ltx_unitary_times,"")
    
    // no harm replacing both (ltx would never have * and nonltx would never have \cdot)
    txt = txt.replaceAll("+-","-")
    

    if (use_ltx && parent===undefined){
        txt = txt.replaceAll("(","\\left(")
        txt = txt.replaceAll(")","\\right)")
    }

    return txt



}




function merge_fraction_products(tree){
    // im going to FIRST manipulate the tree, THEN convert the new tree into an equation

    if(typeof tree === "string" && !is_fraction(tree)){
        return tree
    }
    

    if (typeof tree !== "string"){



        tree.terms = tree.terms.map(merge_fraction_products)

        // tree.terms.forEach(merge_fraction_products)
    }
    
    if (tree.op === "*"){

        let num_terms = []
        let den_terms = []    

        tree.terms.forEach(term=>{
            if (term.op === "/"){
                num_terms.push(term.terms[0])
                den_terms.push(term.terms[1])
            }else{
                num_terms.push(term)
            }
        })

        num_terms = num_terms.filter(term=>{return term !== "1"})  
        den_terms = den_terms.filter(term=>{return term !== "1"})

        if (num_terms.length === 0){
            num_terms = ["1"]
        }

        if (den_terms.length === 0){
            return tree
        }


        let num_tree
        if (num_terms.length === 1){
            num_tree = num_terms[0]
        }else{
            num_tree = {op: "*", terms: num_terms}
        }

        
        
        let den_tree
        if (den_terms.length === 1){
            den_tree = den_terms[0]
        }else{
            den_tree = {op: "*", terms: den_terms}
        }

        return {op: "/", terms: [num_tree, den_tree]}

    

    }else if (tree.op === "^"){

        const base = tree.terms[0]
        const exponent = tree.terms[1]


        let coeff
        if (typeof exponent === "string" && is_number(exponent)){
            coeff = exponent
        }else if (exponent.op === "*"){

            const coeffs = exponent.terms.filter(is_number)
            
            if (coeffs.length > 1){
                throw "should have been condensed to one coefficient"
            }else if (coeffs.length === 1){
                coeff = coeffs[0]
            }else{
                coeff = "1"
            }
    
        }else{
            coeff = "1"
        }

        if (Number(coeff) === 0){
            throw "zero coefficient should have been simplified"
        }else if (Number(coeff) > 0){
            return tree
        }

        const pos_coeff = fuck_you_string(-Number(coeff))


        let pos_exponent
        if (typeof exponent === "string"){
            pos_exponent = pos_coeff
        }else{
            pos_exponent = {...exponent} // i think it is also fine to mute the exponent object, im sort of doing a weird mix of mutating and constructing
            pos_exponent.terms[pos_exponent.terms.length - 1] = pos_coeff
        }
        
        let den_term

        if (Number(pos_exponent) === 1){
            den_term = base
        }else{
            den_term =  {op: "^", terms: [base, pos_exponent]}
        }
    
        //tree.op = "/"
        //tree.terms = ["1",flipped_exp_term]
    
        return {op: "/", terms: ["1", den_term]}

    
    }else if (is_fraction(tree)){

        [num, den] = get_num_den(tree)
        // tree.op = "/"
        // tree.terms = [fuck_you_string(num), fuck_you_string(den)]

        return {op: "/", terms: [fuck_you_string(num), fuck_you_string(den)]}

    }

    return tree
    // the reason for either returning or mutating:
        // mutating: needed to recurse upward
        // returning: if the tree is just a string, can't be mutated

    if (parent === undefined){
        return tree
    }
 
}

//#endregion



function draw(tree){


    config = {
        container: "#eqn-tree"
    };
    chart_config = [config]


    step_down_tree(tree)

    function step_down_tree(tree, parent){
        

        

        if (typeof tree==="string"){
            var val_child = {
                text: tree_name(tree),
            }

            if (parent!==undefined){
                val_child.parent = parent
            }
            chart_config.push(val_child)
        }else{

            const valid_keys = ["op","terms"]
            const keys = Object.keys(tree)
            const invalid_keys = keys.filter(key=>{return !valid_keys.includes(key)}) 
            const missing_keys = valid_keys.filter(key=>{return !keys.includes(key)})
            
            if (invalid_keys.length !== 0){
                throw "invalid keys: "+ invalid_keys
            }

            if (missing_keys.length !== 0){
                throw "missing keys: "+ missing_keys
            }

            if (typeof tree.op !== "string"){
                throw "op not a string: "+ tree.op
            }

            if (!Array.isArray(tree.terms)){
                throw "terms not an array: " + tree.terms
            }




            var op_child = {
                text: tree_name(tree.op),
            }

            if (parent!==undefined){
                op_child.parent = parent
            }


            chart_config.push(op_child)
    


            tree.terms.forEach(term=>{
                
                step_down_tree(term,op_child)
            })
        }


    }
    new Treant( chart_config );

    function tree_name(txt){
        return {name: txt}
    }

}

function update_parent(tree, parent, new_tree){
    let tree_idxs
    
    try{
        tree_idxs = [...Array(parent.terms.length).keys()].filter((idx)=>{return parent.terms[idx] === tree})
    }catch{
        oh = "god"
    }
    



    if (tree_idxs.length === 0){
        throw "tree not child of parent"
    }

    else if (tree_idxs.length > 1){
        throw "tree in multiple places????"
    }

    const tree_idx = tree_idxs[0]
    parent.terms[tree_idx] = new_tree

    // if new_tree is a string, it needs to be done this way (can't mutate a string)
    // otherwise, also perfectly ok to do it this way (i think)
}

function all_terms_equal(terms1, terms2) {

    // check if two trees have all the same values, disregarding order, e.g. a+b+c same as c+a+b

    return term_compare(terms1,terms2)

    function term_compare(arr1, arr2, order_matters){

        if (arr1.length !== arr2.length) {
            return false;
        }

        if (order_matters){
            const all_terms_match = arr1.every((_,idx)=>{
                return tree_compare(arr1[idx],arr2[idx])
            })
            return all_terms_match
        }


        // if order doesnt matter it has to iterate over both and find matches

        const visited = new Array(arr2.length).fill(false);

        for (let i = 0; i < arr1.length; i++) {
            const val1 = arr1[i];
            let found = false;

            for (let j = 0; j < arr2.length; j++) {
                if (!visited[j] && tree_compare(val1, arr2[j])) {
                    visited[j] = true;
                    found = true;
                    break;
                }
            }

            if (!found) {
                return false;
            }
        }

        return true;
    }


    function tree_compare(dict1, dict2){
        
        if (typeof dict1 === "string" || typeof dict2 === "string"){
            return dict1 === dict2
        }

        if (dict1.op !== dict2.op){
            return false
        }

        const op_order_matters = dict1.op === "^"

        return term_compare(dict1.terms, dict2.terms, op_order_matters)
    }


}



//#region testing


const simplify_tests = {

    func:  (exp, use_ltx = false)=>{return tree_to_expression(eqn_to_tree(exp), use_ltx)},

    tests: [
        {
            name: "expand out negative",
            in: "a-(b+c)",
            out: "a-b-c"
        },
        {
            name: "layered subtraction",
            in: "a-b-c-d",
            out: "a-b-c-d"
        },
        {
            name: "layered fractions",
            in: "a/b/c/d",
            out: "a/(b*c*d)"
        },
        {
            name: "layered exponents",
            in: "a^b^c^d",
            out: "a^b^c^d"
        },
        {
            name: "layered parentheses",
            in: "(a+(b*c))*(d/f)",
            out: "((a+b*c)*d)/f"
        },
        {
            name: "square root",
            in: "sqrt(a+b)+c",
            out: "(a+b)^(1/2)+c"
        },
        {
            name: "just give it everything (:<",
            in: "a*b^c^d/f/(g-2)/h",
            out: "(a*b^c^d)/(f*(g-2)*h)"
        },
        {
            name: "remove 1 coefficient",
            in: "a^1/2",
            out: "a/2"
        },
        {
            name: "move coefficient to front",
            in: "g*(-3)+4",
            out: "-3*g+4"
        },
        {
            name: "flip fraction",
            in: "a^(-2)",
            out: "1/a^2"
        },
        {
            name: "contain fractional exponent",
            in: "sqrt(a*b)",
            out: "(a*b)^(1/2)"
        },
        {
            name: "factor addition",
            in: "3*(a^b)+4*a^b+c",
            out: "7*a^b+c"
        },
        {
            name: "factor multiplication",
            in: "a^b*a^c*d+f",
            out: "a^(b+c)*d+f",
        },
        {
            name: "cancel terms",
            in: "(b+c^2)*d*f/((b+c^2)*g)",
            out: "(d*f)/g"
        },
    
        {
            name: "simplify nested exponents",
            in: "(a^b)^(1/b)",
            out: "a"
        },
        {
            name: "raise 0 to an exponent",
            in: "0^0+a",
            out: "ERROR"
        }


    ]

}

const solve_tests = {

    func: (exp) => {
        return tree_to_expression(solve_for(eqn_to_tree(exp), "a"))},

    tests: [
        {
            name: "simple",
            in: "a+b*c+d^2",
            out: "-b*c-d^2"
        },
        {
            name: "invert exponent",
            in: "b*c+a^3*d",
            out: "((-b*c)/d)^(1/3)"
        },
        {
            name: "invert coefficient",
            in: "a*c+d",
            out: "(-d)/c"
        },
        {
            name: "trig inverse",
            in: "sin(a*c)+d*f",
            out: "asin(-d*f)/c"
        },
        {
            name: "combined",
            in: "(b+a^2)/c*d+f",
            out: "((-f*c)/d-b)^(1/2)"
        }
    ]

}

const merge_tests = {



    func: (exp) => {return tree_to_expression(combine_solve_term(eqn_to_tree(exp), "a"))},

    tests: [


        {
            name: "basic merge",
            in: "a*b+a*c",
            out: "a*(b+c)"
        },
        {
            name: "merge with exponent",
            in: "a^2*b*c+a^2*d",
            out: "a^2*(b*c+d)"
        },
        {
            name: "cancel out",
            in: "a*(b*c+d)-a*b*c",
            out: "a*d"
        },
        {
            name: "different exponents",
            in: "a^2*b+a*c",
            out: "ERROR"
        },
        {
            name: "cant combine",
            in: "sin(a*sin(a))",
            out: "ERROR"
        },

        {
            name: "also cant combine",
            in: "sin(a+sin(a))",
            out: "ERROR"
        },
        {
            name: "nested expansion",
            in: "a*b+c*(f*(q*(a+z))+g)",
            out: "c*f*q*z+c*g+a*(b+c*f*q)"
        }

    ]

}

const arithmetic_tests = {
    func:  exp => {
        return num_to_string(math.evaluate(exp)) === tree_to_expression(eqn_to_tree(exp))},

    tests: [

        {
            name: "simple math",
            in: "(3+4)^2",
            out: true
        },
        {
            name: "complicated math",
            in: "(3/7*4/9)/(4+sqrt(7*2)*sin(0.2+3))^2",
            out: true
        }
    ]

}


//#endregion

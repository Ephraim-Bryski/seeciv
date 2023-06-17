// TODO tree_to_eqn isn't handling stuff like g*(-3)+4, nor a^(-2)

// TODO refactor and test the hell out of 



// TODO 0^(-1) give error?



/*

FOR TREE CONSTRUCTION AND SIMPLIFICATION

there are things this simplify cannot do

like it cant figure out that 3*(2+c)-3*c --> 6
HOWEVER, that doesnt matter that much cause when solving for c it will be able to


FOR SOLVING

solve for a variable appearing once (invert the tree)
solve for a variable appearing multiple times (factor out repeatedly until it can't or until they all meet)


note that parents would have to be modified if needed

get complexity/cost for solving for a given variable (should be pretty simple, not sure exactly what heuristics to use)

thats it :D

*/


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
        return String(reduced_num / reduced_den)
    }else{
        return String(reduced_num) + "/" + String(reduced_den)
    }


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
        return String(evaluate_fraction(value1) + evaluate_fraction(value2))
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
        return String(evaluate_fraction(value1) * evaluate_fraction(value2))
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

        const inverted_value = base_number ** -exponent_number

        return construct_fraction("1", String(inverted_value))
    }



    return String(base ** exponent)

}


function take_trig_func(trig_func,value){

    const evaluated_value = String(evaluate_fraction(value))

    const expression = trig_func + evaluated_value + ")" 
    return math.evaluate(expression)   
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


function eqn_to_tree(eqn){



    const items = split_eqn_txt(eqn)

    const tree = search_down_eqn(items)

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

                const inner_items = split_eqn_txt(paren_stripped)
                tree.terms[0] = search_down_eqn(inner_items,tree)

                return tree
            }else{
                return item
            }

        }


        const first_op_idx = items.findIndex(char=>arithmetic_ops.includes(char))

        const term1 = items.slice(0,first_op_idx)
        const term2 = items.slice(first_op_idx+1)

        const op_char = items[first_op_idx]

        tree.op = op_char


        tree.terms[0] = search_down_eqn(term1,tree)
        tree.terms[1] = search_down_eqn(term2,tree)


        return tree
    }



    correct_op_order(tree)

    remove_parens(tree)

    remove_sqrt(tree)

    remove_inverse_op(tree)

    const simplified_tree = simplify_tree(tree)
    return simplified_tree

}


function split_eqn_txt(eqn){
    // splits it into numbers, variables, operations and parentheses groups

    if (eqn[0]==="-"){
        eqn = "0"+eqn   // removes unitary minus
    }
    const op_num_var = /[+\-*/()^]|\b[0-9]+(?:\.[0-9]+)?\b|\b[a-zA-Z]+(?:[0-9]+)?\b/g;

    let items = eqn.match(op_num_var)




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

    // TODO find a less gross way of doing this (as in having a while loop even though it's also recursive)

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
    if (typeof tree === "string"){return}

    if (tree.op === paren_op){
        

        // TODO remove single variables enclosed in parentheses with the original equation string
        const lower_term = tree.terms[0].terms
        if (lower_term === undefined){

            if (parent === undefined){
                // cant handle it here cause the new tree would just be a string
                // but i need to mutate the tree
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
            tree.terms = lower_term //tree.terms[0].terms
        }
    }

    tree.terms.forEach((term)=>{remove_parens(term,tree)})
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

function update_parent(tree, parent, new_tree){
    
    const tree_idxs = [...Array(parent.terms.length).keys()].filter((idx)=>{return parent.terms[idx] === tree})



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


class MyNumber {

    constructor(self, real){
        self.real = real
        self.complex = complex
    }

    add(self, value) {
        
    }



}

function complexPower(base, exponent) {
    const magnitude = Math.pow(Math.abs(base), exponent);
    const phase = Math.PI * exponent * (base < 0 ? 1 : 0);
    
    const real = magnitude * Math.cos(phase);
    const imaginary = magnitude * Math.sin(phase);
    
    return { real, imaginary };
  }
  
  // Example usage
  const base = -1;
  const exponent = 1/2;
  const result = complexPower(base, exponent);
  
  console.log(result); // Output: { real: 6.123233995736766e-17, imaginary: 1 }
 

  console.log(result); // Output: { real: 6.123233995736766e-17, imaginary: 1 }
  


function simplify_arithmetic(tree){

    if (typeof tree === "string"){return tree}

    if (tree.op === "*" && tree.terms.includes("0")){   // a*0 --> 0
        return "0"
    }

    
    if (tree.op === "^" & tree.terms[0] === "0"){

        const exponent = Number(tree.terms[1])
        if (exponent === 0){
            throw "0/0 found"
        }else if (exponent < 0){
            throw "infinite value found"
        }
    }


    // TODO these can just go into the conditional below
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
            return String(new_value)
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

            const exponent = tree.terms[1]
            const common_terms = tree.terms[0].terms

            const num_coeff = common_terms.filter(is_number)

            const non_int_exponent = is_fraction(exponent) || exponent.includes(".")



            const contains_complex = num_coeff.length !== 0 && Number(num_coeff) < 0 && non_int_exponent


        

            if (common_terms.some(is_number)){}

            const product_terms = common_terms.map(term=>{
                return {op: "^", terms: [term,exponent]}
            })

            const new_tree = {op: "*", terms: product_terms}
            return simplify_tree(new_tree)      

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
        const final_value = String(value)


        const are_all_numbers = tree.terms.every(is_number)

        const remove_numbers = tree.op === "+" && final_value === "0" || tree.op === "*" && final_value ===  "1"    // TODO could just say if final value is initial value
            

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

    const new_tree = {op: tree.op, terms: new_terms}

    return new_tree
}


// TODO two bugs gotta fix both
/*



multiplication fractions isnt considering negative values



*/

function is_tree(term){


    const keys = Object.keys(term).filter(key=>{return key !== "inverted"}).sort()      // when constructing the tree it adds an inverted property, so i just filter it out5
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


function simplify_tree(tree0,parent){

    //! for some reason it seems to mutate tree0 as well
        // SOLVED (i think) update_parent is obviously what's mutating it
        // i think i could 
        // doesnt matter right now, but it might be an issue
        // i also dont know why its happening

    if (typeof tree0 === "string"){return tree0}

    tree0.terms.forEach((term)=>{simplify_tree(term,tree0)})

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
            }else{
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




function solve_for(tree, parent, variable){


    // this woul assume the variable has already been factored out (only occurs once)

    const lineage = [] 

    find_lineage(tree, parent)

    function find_lineage(tree, parent){
    
        tree.terms.forEach((term)=>{find_lineage(term,tree)})
    
        if (tree === variable || lineage.includes(tree) ){
            lineage.push(parent)
        }

    }




    lineage.reverse()

    lineage.forEach(super_parent=>{


        super_parent.op

    })


    



}






// TODO move terms on to the two sides of the equation depending on sign <-- assumes highest operation is "+"



function tree_to_eqn(tree, use_ltx = false, parent){

    if (typeof tree === "string"){return tree}


    tree = merge_fraction_products(tree)

    const terms = tree.terms.map(term=>{
        
        let sub_txt

        if (typeof term === "string"){
            sub_txt = term
            if (tree.op === "^" && is_fraction(term)){
                sub_txt = "("+sub_txt+")"   // cannot be moved to the need_parens conditional since it's just a string
            }
        }else{
            sub_txt = tree_to_eqn(term, use_ltx, tree)
        }
        
        return sub_txt
    })


    let txt 


    if (tree.op === "/"){
        const num = terms[0]
        const den = terms[1]
        if (use_ltx){

            // TODO the numerator and denominator would have parentheses, fix this

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
            throw "there should only be one coefficient"
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


    
    if (parent === undefined){
        need_parens = false
    }else if(parent.op === "^" && use_ltx){
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
    
        need_parens = upper_priority>lower_priority
    }

    if (need_parens){
        txt = "("+txt+")"
    }


    const unitarty_times = /(?<=[^a-zA-Z0-9])1\*/g
    txt = txt.replace(unitarty_times,"")
    txt = txt.replaceAll("+-","-")
    
    return txt

}


const tree = eqn_to_tree("a/b")

tree_to_eqn(tree)

function merge_fraction_products(tree){
    // im going to FIRST manipulate the three, THEN convert the new tree into an equation

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

        if (den_terms.length !== 0){
            num_tree = {op: "*", terms: num_terms}
            den_tree = {op: "*", terms: den_terms}
            // tree.op = "/"
            // tree.terms = [num_tree, den_tree]

            return {op: "/", terms: [num_tree, den_tree]}

        }

        return tree

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

        const pos_coeff = String(-Number(coeff))


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
        // tree.terms = [String(num), String(den)]

        return {op: "/", terms: [String(num), String(den)]}

    }

    return tree
    // the reason for either returning or mutating:
        // mutating: needed to recurse upward
        // returning: if the tree is just a string, can't be mutated
        // TODO? instead of a single number tree being a string, it would still be a data structure

    if (parent === undefined){
        return tree
    }
 
}


function draw(tree){


    config = {
        container: "#basic-example"
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


function arithmetic_check (exp){
    return math.evaluate(exp) === tree_to_eqn(eqn_to_tree(exp))
}


const back_and_forth = (exp, use_ltx = false)=>{
    return tree_to_eqn(eqn_to_tree(exp), use_ltx)
}


// export {back_and_forth, arithmetic_check}

const layering_tests = [

    {
        name: "expand out negative",
        func: back_and_forth,
        in: "a-(b+c)",
        out: "a-b-c"
    },
    {
        name: "layered subtraction",
        func: back_and_forth,
        in: "a-b-c-d",
        out: "a-b-c-d"
    },
    {
        name: "layered fractions",
        func: back_and_forth,
        in: "a/b/c/d",
        out: "a/(b*c*d)"
    },
    {
        name: "layered exponents",
        func: back_and_forth,
        in: "a^b^c^d",
        out: "a^b^c^d"
    },
    {
        name: "layered parentheses",
        func: back_and_forth,
        in: "(a+(b*c))*(d/f)",
        out: "((a+b*c)*d)/f"
    },
    {
        name: "square root",
        func: back_and_forth,
        in: "sqrt(a+b)+c",
        out: "(a+b)^(1/2)+c"
    },
    {
        name: "just give it everything (:<",
        func: back_and_forth,
        in: "a*b^c^d/f/(g-2)/h",
        out: "(a*b^c^d)/(f*(g-2)*h)"
    },
    {
        name: "remove 1 coefficient",
        func: back_and_forth,
        in: "a^1/2",
        out: "a/2"
    }

]

const stuff_that_failed = [
    {
        func: back_and_forth,
        in: "g*(-3)+4",
        out: "-3*g+4"
    },
    {
        func: back_and_forth,
        in: "a^(-2)",
        out: "1/a^2"
    }
]


const all_tests = [layering_tests,stuff_that_failed].flat()

function test(tests = all_tests){

    if (tests === undefined){
        throw "need to specify test, run test to run all tests"
    }

    function is_equal(a,b){
        return JSON.stringify(a) === JSON.stringify(b)
    }

    tests.forEach(test_exp=>{


        // very hacky but whatever

        const input_keys = Object.keys(test_exp.in)


        try{

            let output
            if (input_keys.length === 1 && input_keys[0] === "args"){
                output = test_exp.func(...test_exp.in.args)
            }else{
                output = test_exp.func(test_exp.in)
            }
            const expected_output = test_exp.out

            if (is_equal(output, expected_output)){
                console.log(`Test "${test_exp.name}" passed`)
            }else{
                console.warn(
`Test "${test_exp.name}" failed
             Output: ${output}
    Expected Output: ${expected_output}`)
            }
        }catch(e){
            console.warn(
`Test ${test_exp.name} gave unexpected error
    Error: ${e}`)
        }
    })

}


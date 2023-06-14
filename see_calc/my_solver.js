// TODO

/*

FOR TREE CONSTRUCTION AND SIMPLIFICATION


handle 0* 0+ etc.
convert back to expression (math and ltx)


FOR SOLVING

solve for a variable appearing once (invert the tree)
solve for a variable appearing multiple times (factor out repeatedly until it can't or until they all meet)

substitute in (simplify the tree repeatedly, which is largely code i already wrote)

note that parents would have to be modified if needed

get complexity/cost for solving for a given variable (should be pretty simple, not sure exactly what heuristics to use)

thats it :D

*/




const priorities = {
    "+": 0,
    "-": 0,
    "*": 1,
    "/": 1.5, // always fractions so higher priority than "*"
    "^": 2
}

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

const ops = Object.keys(priorities)

function op_priority(op){

    if (!Object.keys(priorities).includes(op)){throw "opeartion "+op+" has no priority defined"}

    return priorities[op]
}



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

const grouped_trig_funcs = trig_funcs.map(func=>{return func+"("})

const paren_op = "("

const sqrt_op = "sqrt("

const unitary_ops = [paren_op, sqrt_op].concat(grouped_trig_funcs)



function eqn_to_tree(eqn){



    const items = split_eqn(eqn)

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

                const inner_items = split_eqn(paren_stripped)
                tree.terms[0] = search_down_eqn(inner_items,tree)

                return tree
            }else{
                return item
            }

        }


        const first_op_idx = items.findIndex(char=>ops.includes(char))

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



    
    simplify_tree(tree)

    return tree

}


function split_eqn(eqn){
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

function simplify_tree(tree){
    
    flatten_duplicates(tree)

    eliminate_terms(tree)
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
        

        // TODO remove single variables enclosed in parentheses with the original equation string instead
        // get rid of this disgusting edge case O:
            // this would mean no need to pass the parent as an argument
        //! i added this code in later possible this isn't right
        //! for dealing with just one thing in parentheses, e.g. (3)+a
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


function flatten_duplicates(tree){

    // TODO this should be part of the eliminate terms function

    // a*(c+c) --> a*c*2 <-- this needs to be flattened

    // a+b+c should be three branches from one plus op


    const flatten_ops = ["+","*"]


    if (typeof tree === "string"){return}

    
    tree.terms.forEach(flatten_duplicates)


    const duplicate_terms = tree.terms.filter(term=>{

        if (typeof term === "string"){return false}

        const op_upper = tree.op
        const op_lower = term.op


        return op_upper === op_lower && flatten_ops.includes(op_upper)
    })

    
    if (duplicate_terms.length === 0){return}


    const new_terms = tree.terms.map(term=>{
        if (duplicate_terms.includes(term)){
            return term.terms
        }else{
            return term
        }
    }).flat()

    tree.terms = new_terms


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
    parent[tree_idx] = new_tree

    // if new_tree is a string, it needs to be done this way (can't mutate a string)
    // otherwise, also perfectly ok to do it this way (i think)
}

function get_simp_arithmetic(tree){

    // RETURNS A NEW THING, DOES NOT MUTATE TREE
        // this is necessary since it can return a string


    if (tree.op === "*" && tree.terms.includes("0")){
        return "0"
    }

    if (tree.op === "^" && tree.terms[1] === "0"){
        return "1"
    }

    const are_all_numbers = tree.terms.every(is_number) 
    const numbers = tree.terms.filter(is_number)
    const non_number_terms = tree.terms.filter(term => {return !numbers.includes(term)})


    if (tree.op === "^"){
        if (are_all_numbers){
            const new_value = Number(tree.terms[0]) ^ Number(tree.terms[1])
            return String(new_value)
        }else{
            return tree
        }
    }


    const cum_init_values = {
        "+": 0,
        "*": 1
    }
    
    const cum_funcs = {
        "+": (a,b)=>{return a+b},
        "*": (a,b)=>{return a*b}
    }

    const cum_ops = ["+","*"]

    if (cum_ops.includes(tree.op)){

        const op_func = cum_funcs[tree.op]
        let value = cum_init_values[tree.op]

        numbers.forEach(term=>{
            value = op_func(value,term)
        })
        const final_value = String(value)

        if (are_all_numbers){
            return final_value
        }else{
            const new_terms = [non_number_terms,final_value].flat()
            const new_tree = {op: tree.op, term: new_terms}
            return new_tree
        }

    }

    else if (unitary_ops.includes(tree.op)){
        throw "uniterary operations not implemented yet"
    }

    // TODO trig functions could either use math.evaluate or would have to write out all the function mappings

    throw "all cases should have been handled"
}

function get_flat_subtree(tree){
    // NOT RECURSIVE
    // AGAIN RETURNS DOESNT MUTATE (could do it by mutating though)


    if (tree.terms.length === 1){
        throw "i thought this case would no longer occur with how i simplify arithmetic"
        return {op: tree.op, terms: tree.terms[0].terms}

    }


    const is_flattable_op = ["+","*"].includes(tree.op)

    if (!is_flattable_op){return tree}

    const new_terms = tree.map(subtree=>{
        if (typeof subtree !== "string" && tree.op === subtree.op){
            return subtree.terms
        }else{
            return subtree
        }
    })

    const new_tree = {op: tree.op, terms: new_terms}

    return new_tree
}

function is_number(term){
    return typeof term === "string" && !isNaN(Number(term)) 
}

function eliminate_terms(tree, parent){

    if (typeof tree === "string"){return}

    tree.terms.forEach((term)=>{eliminate_terms(term,tree)})

    
    tree = get_flat_subtree(tree)

    const factorable_op = ["+","*"].includes(tree.op) 

    let terms
    if (factorable_op){

        // TODO i think i would also have to flatten duplicate operations here on the lower terms
        // 3*a + 4*a --> 12*a

        const tree_sub_op = upper_op[tree.op]  // for 3*a + 4*a,    treeSubOp would be "*"

        const number_terms = tree.terms.filter(is_number)

        const non_number_terms = tree.terms.filter((term)=>{return !number_terms.includes(term)})

        const prod_sub_terms = non_number_terms.map(term=>{
            if (term.op === tree_sub_op){
                return term
            }else{
                return {
                    op: tree_sub_op,
                    terms: [term,"1"]
                }
            }
        })
        
        function already_added(term){
            return grouped_sub_terms.flat().includes(term)
        }

        // group the terms with common subterms
        const grouped_sub_terms = []
        prod_sub_terms.forEach(term1=>{
            if (already_added(term1)){return}
            const sub_term_group = [term1]
            grouped_sub_terms.push(sub_term_group)
            prod_sub_terms.forEach(term2=>{ 
                if (already_added(term2)){return}
                const common_term1 = remove_coeff(term1)
                const common_term2 = remove_coeff(term2)
                if (trees_equal(common_term1,common_term2)){
                    sub_term_group.push(term2)
                }
            })
        })



        const new_subtrees = grouped_sub_terms.map(group=>{

            // say the group is (4)*b + (-4)*b

            const coeffs = group.map(get_coeff)
            const coeff_tree = {op: tree_sub_op, terms: coeffs}
            const combined_value = get_simp_arithmetic(coeff_tree)   // (4)+(-4) --> 0
            
            if (typeof combined_value !== "string"){
                throw "getCondensedTree should have returned a single number"
            }

            const common_terms = remove_coeff(group[0])

            const new_tree = {op: tree.op, terms: [common_terms,combined_value].flat()}
            const simplified_tree = get_simp_arithmetic(new_tree)    // 0*b --> 0        (unless it's times or to the power of 0, the simplified tree is the same as the original)
            
            return simplified_tree
        })

        /* @code
        // add the common coefficients together
        const new_subtrees = grouped_sub_terms.map(group=>{

            
            const coeffs = group.map(get_coeff)
            const coeff_sum = cum_sum(coeffs)   
            
            // TODO instead of cumSum, use operate on them

            let new_subtree = remove_coeff(group[0])

            if (coeff_sum !== 1){   // TODO this check should no longer be needed since i would then be operating on the terms of the new subtree
                new_subtree.terms.push(String(coeff_sum))
            }

            if (new_subtree.terms.length === 1){
                return new_subtree.terms[0] // TODO again not necessary, operate function would return itself for a single element
            }
            return new_subtree
        })
        */

        //! i think all of this can now be outside of the if statement since getCondensedTree handles all cases
        terms = [number_terms,new_subtrees].flat()


        // (4)*b+(-4)*b+5 
        // now the new terms are 0+(-4)*b+5
        // now need one more pass through condensing the tree to get (-4)*b+5

        // if there were no common terms, this would still be performed (the empty array would be flattened out first)



        /* @code getCondensedTree already handles all this
        // im merging and then splitting since it's possible new_subtrees has a number term
        // TODO simpler way of doing this? (just do the number filter on new_subtrees)



        // TODO do something similar for exponents but it wouldn't be cumulative
        const initial_value = op_initial_value[tree.op]
        let cumulative_val = initial_value
        const new_non_number_terms = new_terms.filter(term=>{
            if (is_number(term)){
                //! very similar to cum_sum, maybe fit this into the function
                cumulative_val = op_func[tree.op](cumulative_val,Number(term))
            }

            return !is_number(term)
        })


        // TODO i think right here i can handle the case where it's *0
        if (cumulative_val === initial_value){
            tree.terms  = new_non_number_terms
        }else{
            tree.terms = [new_non_number_terms,String(cumulative_val)].flat()
        }

        */

    }else{
        terms = tree.terms
    }





    const simplifed_tree = get_simp_arithmetic({op: tree.op, terms: terms})


    // TODO this is basically the code to remove duplicates, might be able to call a single function
    if (tree.terms.length === 1 && !unitary_ops.includes(tree.op)){

        if (parent === undefined){

            if (typeof tree.terms[0] === "string"){
                throw "i think the input must have been pure arithmetic, write code to evaluate it immediately in the string"
            }

            tree.op = tree.terms[0].op
            tree.terms = tree.terms[0].terms
        }else{
            const new_parent_terms = parent.terms.map(term=>{
                if (term === tree){
                    return tree.terms[0]
                }else{
                    return term
                }
            })
    
            parent.terms = new_parent_terms
        }




    }




    // get subterms if there's only one operation, and just the term otherwise
    // TODO there's a chance the unitary op is at the very top of the tree (i think just when it's arithmetic)
        // not sure where to handle this case
    
    /* @code
    const new_terms = tree.terms.map(term=>{
        const not_missing_operands = typeof term === "string" || unitary_ops.includes(term.op) || term.terms.length > 1
        if (typeof term !== "string" && term.terms.length === 0){
            throw "not sure if this is possible, so probably good to check whats going on"
        }
        if (not_missing_operands){
            return term
        }else{
            return term.terms[0]
        }
    })


    tree.terms = new_terms
    */


    function remove_coeff(tree){

        // TODO this check might become unnecesary
        // if (typeof tree === "string"){return ""}

        const new_terms = tree.terms.filter(term=>{
            return !is_number(term)
        })

        const new_tree = {...tree}

        new_tree.terms = new_terms

        return new_tree
    }

    function get_coeff(tree,upper_op){

        
        const coeffs = tree.terms.filter(is_number)


        if (coeffs.length === 0){
            return 1
        }else if (coeffs.length === 1){
            return Number(coeffs[0])
        }

        if (coeffs.length > 1){
            throw "coefficients should have already been condensed"
        }
        
        return Number(coeffs[0])
    }

}







// TODO move terms on to the two sides of the equation depending on sign <-- assumes highest operation is "+"


function tree_to_eqn(tree, use_ltx = false, parent){

    const useless_one = "USELESS ONE IDENTIFIER"

    const terms = tree.terms.map(term=>{
        
        let sub_txt
        let op

        if (typeof term === "string"){

            op = tree.op

            const term_parent = tree
            const term_grandparent = parent

            const ops_invertable = term_grandparent !== undefined && upper_op[term_grandparent.op] === term_parent.op

            if ( ops_invertable && Number(term)<0){                
                tree.inverted = true

                // for cases like a+b*(-1), the "-1" was just constructed from the tree, so would otherwise output a+b*1 
                if (Number(term) === -1){
                    return useless_one
                }

                sub_txt = String(-1*Number(term))

            }else{
                sub_txt = term
            }

        }else{

            sub_txt = tree_to_eqn(term, use_ltx, tree)
            
            if (term.inverted){
                op = inverse_op[tree.op]
            }else{
                op = tree.op
            }
        }

        const sub_term = {
            txt: sub_txt,
            op: op
        }

        return sub_term

    }).filter(term=>{
        return term !== useless_one
    })


    if (terms.length === 0){throw "they shouldnt all be useless D:"}

    let txt 

    if (tree.op === "*"){

        const frac_terms_to_txt = (terms)=>{
            const txts = terms.map(term=>{
                return term.txt
            })
            
            let txt = txts.join("*")

            if (use_ltx){
                txt = "{"+txt+"}"
            }else if (txts.length !== 1){
                txt = "("+txt+")"
            }
            return txt
        }

        const den_terms = terms.filter(term=>{
            return term.op === "/"
        })

        const num_terms = terms.filter(term=>{
            return term.op === "*"
        })


        const any_other_terms = terms.some(term=>{
            return ( !den_terms.includes(term)) && ( !num_terms.includes(term))
        })

        if (any_other_terms){throw "operations should all be * or /"}

        if (num_terms.length === 0){
            num_terms = ["1"]
        }

        if (den_terms.length === 0){

            txt = num_terms.map(term=>{
                return term.txt
            }).join("*")


        }else{
            const num_txt = frac_terms_to_txt(num_terms)
            const den_txt = frac_terms_to_txt(den_terms)
            
            if (use_ltx){
                txt = "\\frac"+num_txt+den_txt
            }else{
                txt = num_txt+"/"+den_txt
            }
        }
    }else{

        txt = terms.map((term,idx)=>{


            if (use_ltx && tree.op === "^" && idx === 1){    
                txt = "{"+term.txt+"}"
            }else{
                txt = term.txt
            }


            if (unitary_ops.includes(term.op)){


                let opener = term.op.slice(0,term.op.length-2)
                if (use_ltx){

                    // who says nesting is bad? ):<

                    opener = "\\"+opener
                }

                return opener + txt +")"
            }else if (idx===0){
                return txt
            }else{
                return term.op+txt
            }
        })

        txt = txt.join("")

    }

    let need_parens

    if (parent === undefined){
        need_parens = false
    }else if(parent.op === "^" && use_ltx){
        need_parens = false
    }else if(unitary_ops.includes(parent.op) || unitary_ops.includes(tree.op)){
        need_parens = false
    }else{

        const upper_priority = op_priority(parent.op)
        const lower_priority = op_priority(tree.op)
    
        need_parens = upper_priority>lower_priority
    }

    if (need_parens){
        txt = "("+txt+")"
    }
    
    return txt

}

function draw_tree(tree){


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

function test(){


    const back_and_forth = (exp)=>{
        return tree_to_eqn(eqn_to_tree(exp))
    }


    const tests = [

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
            out: "(a+b)^1/2+c"  // TODO put parentheses aroung the exponent?
        },
        {
            name: "just give it everything (:<",
            func: back_and_forth,
            in: "a*b^c^d/f/(g-2)/h",
            out: "(a*b^c^d)/(f*(g-2)*h)"
        }

    ]

    tests.forEach(test_exp=>{

        try{
            const output = test_exp.func(test_exp.in)
            const expected_output = test_exp.out

            if (output === expected_output){
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




function trees_equal(tree1, tree2) {

    // check if two trees have all the same values, disregarding order, e.g. a+b+c same as c+a+b

    return operations_equal(tree1,tree2)

    function terms_equal(arr1, arr2, order_matters){

        if (arr1.length !== arr2.length) {
            return false;
        }

        if (order_matters){
            const all_terms_match = arr1.every((_,idx)=>{
                return operations_equal(arr1[idx],arr2[idx])
            })
            return all_terms_match
        }


        // if order doesnt matter it has to iterate over both and find matches

        const visited = new Array(arr2.length).fill(false);

        for (let i = 0; i < arr1.length; i++) {
            const val1 = arr1[i];
            let found = false;

            for (let j = 0; j < arr2.length; j++) {
                if (!visited[j] && operations_equal(val1, arr2[j])) {
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


    function operations_equal(dict1, dict2){
        
        if (typeof dict1 === "string" || typeof dict2 === "string"){
            return dict1 === dict2
        }

        if (dict1.op !== dict2.op){
            return false
        }

        const op_order_matters = dict1.op === "^"

        return terms_equal(dict1.terms, dict2.terms, op_order_matters)
    }


}































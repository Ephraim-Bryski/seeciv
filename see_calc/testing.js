

all_cas_tests = [simplify_tests, solve_tests, merge_tests, arithmetic_tests]


function test(){
    const cas_passed = test_cas()
    const solver_passed = test_sheets()
    const all_passed = cas_passed && solver_passed

    if (all_passed){
        console.log("EVERYTHING PASSED :D")
    }else{
        console.warn("SOMETHING FAILEDDDDDDDDDDD")
    }
}

function test_cas(test_suites = all_cas_tests){

    function is_equal(a,b){
        return JSON.stringify(a) === JSON.stringify(b)
    }

    
    let failed = 0

    test_suites.forEach(suite => {

        const func = suite.func

        suite.tests.forEach(test_exp=>{


            // very hacky but whatever

            const input_keys = Object.keys(test_exp.in)



            let output, error_msg
            try{
                if (input_keys.length === 1 && input_keys[0] === "args"){
                    output = func(...test_exp.in.args)
                }else{
                    output = func(test_exp.in)
                }
            }catch(e){
                output = "ERROR"
                error_msg = e
            }

            const expected_output = test_exp.out

            if (is_equal(output, expected_output)){
                console.log(`Test "${test_exp.name}" passed`)
            }else{
                failed += 1
                console.warn(
`Test "${test_exp.name}" failed
            Output: ${output}
    Expected Output: ${expected_output}`)

                    if (error_msg !== undefined){
                        console.warn(error_msg)
                    }

            }

        })

    })

    
    const all_passed = failed === 0


    if (all_passed){
        console.log("all tests passed :)")
    }else{
        console.warn(failed + " tests failed o:")
    }
    
    return all_passed
}


function OLD_test_solver(){
    
    const test_folder = firebase_data.filter(folder=>{return folder.name === "Tests"})[0]

    const sheets = test_folder.children.filter(sheet => {return sheet!=="blank"})



    let fail_count = 0
    sheets.forEach(sheet => {

        const passed = test_sheet(sheet, sheet.error_type)

        if (!passed){
            fail_count += 1
        }
    })


    const all_passed = fail_count === 0

    if (all_passed){
        console.log("All passed :)")

    }else{
        console.warn(`${fail_count} tests failed O:`)

    }
    
    return all_passed
}


function OLD_test_sheet(sheet, error_type){
    const sheet_name = sheet.name
    const sheet_data = sheet.blocks
    const result = calc(sheet_data, 0, sheet_data.length)

    function get_system(block_name){
        const blocks = result.filter(block => {return block.name === block_name})

        if (blocks.length !== 1){throw "should just be a single block with the name"}


        const block = blocks[0]

        const eqns = block.eqns.map(eqn => {
            return eqn.result
        }).flat().flat() // double flat cause of sub tables

        return eqns
    }


    let correct_output

    for (block of result){
        for (line of block.eqns){
            
            const solve_parts = line.input.replaceAll(" ","").split("\\operatorname{solve}")

            if (solve_parts.length !== 2){continue}

            if (correct_output !== undefined){throw "can only test sheet with one solve line"}

            if (solve_parts[0] !== ""){throw "wut"}

            const system_name = solve_parts[1]

            const system = get_system(system_name)

            const system_sol = line.result

            const expected_error = error_type!==undefined
            const got_error = system_sol instanceof Error

            if (expected_error!==got_error){
                correct_output = false
            }else if (expected_error){
                correct_output = system_sol instanceof error_type
            }else{
                correct_output = check_solution(system, system_sol)
            }
        }
    }

    if (correct_output){
        console.log(`${sheet_name} passed`)
    }else{
        console.warn(`${sheet_name} failed`)
    }

    return correct_output
}




function check_solution(eqns, all_row_sols){
    
    const sols = all_row_sols[0]


    const sol_vals = sols.map(sol => {return sol.split("=")[1]}).map(ltx_to_math)
    const sol_vars = sols.map(sol => {return sol.split("=")[0]})

    const all_correct = eqns.every(eqn => {

        const result = sub_all_vars(eqn, sol_vars, sol_vals)
    
        const value = Number(eqn_to_tree(ltx_to_math(result)))
        const is_correct =  is_near_zero(value)

        return is_correct
    })

    return all_correct
}


function test_sheets(){
    
    const library_sheets = get_firebase_data()


    const test_folder = library_sheets.filter(item => {return item.children && item.name === "Tests"})[0]
    
    let all_pass = true

    const sheets = test_folder.children
    
    for (let sheet of sheets){
        if (sheet === sheets[sheets.length-1]){
            // continue
        }
        if (sheet === "blank"){continue}
        const old_sheet = sheet.blocks
        load_sheet(["Tests",sheet.name],"")
        const new_sheet = DOM2data()
        const new_computed_sheet_with_errors = calc(DOM2data(),0,new_sheet.length)
        const new_computed_sheet = replace_errors_with_messages(new_computed_sheet_with_errors)
        const is_match = compare_ignore_key_order(old_sheet, new_computed_sheet)
        if (is_match){
            console.log('yay :)')
        }else{
            all_pass = false
            console.warn(sheet.name)
        }
    }

    return all_pass


}



function compare_ignore_key_order(item1, item2) {


    const con1 = item1.constructor
    const con2 = item2.constructor


    if (con1 !== con2){
        return false
    }

    const constructor = con1


    if (constructor === Object){
        // dictionary

        const keys1 = [...Object.keys(item1)]
        const keys2 = [...Object.keys(item2)]

        if (keys1.length !== keys2.length){
            return false
        }

        return keys1.every(key=>{
            return compare_ignore_key_order(item1[key], item2[key])
        })

    }else if (constructor === Array){
        
        if (item1.length !== item2.length) {
            return false;
        }

        return item1.every((_,idx)=>{
            return compare_ignore_key_order(item1[idx],item2[idx])
        })
        

    }else{
        return item1 === item2
    }


}

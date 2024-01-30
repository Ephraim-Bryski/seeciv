function numeric_solve_with_bisection(exp_ltx){

    /*
    uses bisection instead so things don't shoot off to infinity
    but has its own issus, can't really remember
    */

    const exp = ltx_to_math(exp_ltx)
    var exp_vars = get_all_vars(exp_ltx)
    if (exp_vars.length!==1){throw "can only have one variable, has multiple: "+exp_vars}


    const solve_var = exp_vars[0]
    const f = (value)=>{return evaluate(exp,solve_var,value)}

    const max_val = 1000

    const n_guesses = 10**4

    const ascending = Array.from(Array(n_guesses), (_, index) => index + 1);
    const descending = ascending.map(val => {return -val})

    const int_vals = [ascending,descending].flat()
    const guesses = int_vals.map(val => {return sign(val)*val**2 * max_val/n_guesses**2})

    let bound1 = null
    let root = null

    let prev_y, y

    for (value of guesses){
        
        const y_new = f(value)

        if (!is_real(y_new)){
            bound1 = null
            continue
        }

        prev_y = y
    
        y = y_new


        if (bound1 === null || y*prev_y >= 0){
            bound1 = value
            continue

        }

        let low_bound, high_bound

        if (value>0){
            low_bound = bound1
            high_bound = value
        }else{
            low_bound = value
            high_bound = bound1
        }

        root = bisection(exp,low_bound,high_bound,solve_var)

        if (root === null){
            bound1 = value
            continue
        }else{
            break
        }
        
    }

    if (root === null){
        throw "nothing found"
    }

    return num_to_string(root)
  

}

function bisection(exp,low_bound, high_bound, solve_var = "x"){

    const f = (value)=>{return evaluate(exp,solve_var,value)}

    tol = 10**-9

    const max_count = 100

    let count = 0
    
    let x_low = low_bound

    let x_high = high_bound

    let x_mid

    while (x_high-x_low>tol){
        
        x_mid = (x_high+x_low)/2

        //! could be more efficient by not computing x_low when it's not updated
        if (f(x_mid)*f(x_low)>0){
            // mid and low are same signs
            // means it's between mid and right
            x_low = x_mid
        }else{
            x_high = x_mid
        }

        if (count > max_count){
            return null
        }

        count +=1

    }

    return x_mid




}



function evaluate(expression,solve_var,value){
    return math.evaluate(
        sub_all_vars(expression,solve_var,String(value))
    )
}


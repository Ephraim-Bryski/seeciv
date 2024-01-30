
/*

attempt to allow it solve system of equations numerically

for now not being used

*/


function mv_NR(exps){

    /*


    multivariate newton raphson
    stuff got lost when I was making a git branch so this is old and doesn't work (mainly issues with how I made the jacobian)
    could be good (i think faster) alternative to nerdamer solveequations

    */


    const solve_vars = get_all_vars(exps)
    if (solve_vars.length !== exps.length){throw "nooope"}



    var prev_guess
    var guess = 1

    var tol = 0.001
    const max_count = 100

    var F = (x)=>{

        const x_str = x.map(x_val=>{return x_val.toString()})

        exps.map((exp)=>{
            return math.evaluate(
                sub_all_vars(exp,solve_vars,x_str)
            )
        })
    }

    function Fprime(f,x) {
        var h = 0.001;
        return math.divide(math.subtract(f(math.add(x,h)),f(math.subtract(x,h))),2*h)
    }

    function Grad(X){
        // x is a vector of x values
        // returns a matrix, rows are functions, columns are variables
        return F.map((f)=>{
            return X.map(x=>{
                return Fprime(f,x)
            })
        })
    }

    var iter_count = 0
    while (prev_guess===undefined || math.norm(math.subtract(guess,prev_guess))>tol){

        
        const inv_grad = math.inv(Grad(guess))
        const f = F(guess)

        const new_guess = math.subtract(guess,math.divide(f,inv_grad))

        var prev_guess = guess
        var guess = new_guess
        console.log(guess)
        iter_count+=1


        const has_nan = guess.any(val=>{return isNaN(val)})

        if (iter_count>max_count || has_nan){
            throw "Cannot find solution, possibly no real solutions"
        }
    }

    var real_comp =  math.re(guess)
    var im_comp = math.im(guess)

    if (math.norm(im_comp)>1e-10){throw "No real solutions"}

    const sol = real_comp.map(val=>{return val.toString()})

        
    return solve_vars.map((_,i)=>{
        return {var: solve_vars[i], exp: sol[i]}
    })

    // in case newton raphson doesnt work:

    //var nerd_sols = nerdamer.solve(exp,solve_var).symbol.elements
    // nerdamer can be a bit weird with complex solutions but if there's only one solution it should be ok
    //if (nerd_sols.length===1){return nerd_sols[0].toString()}

    // otherwise use newton raphson
}
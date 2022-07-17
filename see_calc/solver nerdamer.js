var eqns = [ 

    "1=v*h",
    "1=h+v^2/(20)"
    
    ]
    
    var eqns = [
        "1=1/v+v^2/20"
    ]


var eqns = [ "qb=vb*hb",
"Q=qb*B1",
"qc=vc*hc",
"Q=qc*B2",
"H=hb+vb^2/(2*g)",
"H=hc+vc^2/(2*g)",
"Fr=va/sqrt(g*ha)",
"hb/ha=1/2*(-1+sqrt(1+8*Fr^2))",
"g=9.81",
"B1=1",
"B2=2",
"Q=3",
"ha=1",
"qa=va*ha",
"Q=qa*B1"]






var eqns = [
    "dL1=F*L/(f*A1)",
"A1=pi*D^2/4",
"dL2=F*L/(f*A2)",
"A2=pi*D^2/4",
"L=5",
"f=10",
"dL1+dL2=dLTot",
"dLTot=1",
"D=1"
]

var eqns = [
    
"sav=(sx+100)/2",
"R=sqrt(((sx-100)/2)^2+35^2)",
"smax=sav+R",
"smin=sav-R",
"tan(2*a)=2*35/(sx-100)",
"Tmax=1/2*(smax-smin)",
"sav=(sx+sy)/2",
"R=sqrt(((sx-sy)/2)^2+T^2)",
"smax=sav+R",
"smin=sav-R",
"tan(2*a)=2*T/(sx-sy)",
"Tmax=1/2*(smax-smin)"
]


var eqns = [
    "Ks=sqrt(1/(2*n*tanh(k*d)))",
"n=0.5*(1+2*k*d/(sinh(2*k*d)))",
"k=2*pi/L",
"H/H0=Ks",
"L=g*T^2/(2*pi)*tanh(k*d)",
"T=1",
"d=1",
"H0=3",
"g=9.81"
]
/*

var eqns = ["g=9.81",
"B1=1",
"B2=2",
"Q=3",
"ha=1",

"Q=qa*B1",
"Q=qb*B1",
"Q=qc*B2",

"qa=va*ha",

"Fr=va/sqrt(g*ha)",

"hb/ha=1/2*(-1+sqrt(1+8*Fr^2))",

"qb=vb*hb",

"H=hb+vb^2/(2*g)"]

*/

var eqns = [
    "sav=(20+100)/2",
"R=sqrt(((20-100)/2)^2+35^2)",
"smax=sav+R",
"smin=sav-R",
"a=2*35/(20-100)",
"Tmax=1/2*(smax-smin)",
"sav=(sx+sy)/2",
"R=sqrt(((sx-sy)/2)^2+T^2)",
"smax=sav+R",
"smin=sav-R",
"30*3.14/180=2*T/(sx-sy)",
"Tmax=1/2*(smax-smin)"
]


//console.log(solve_eqns(eqns))



function unit_test(func,problem,expectation){
    try{
        var result = func(problem)
    }catch(error){
        var result = error
    }
    if (areEqual(result,expectation)){
        console.log("PASS")
    }else{
        console.log("FAIL")
        console.log(result)
    }


    
    // JS is retarded and arrays are objects so [3,4]==[3,4] is false so you need to check if the arrays are the same using this
    function areEqual(array1, array2) {
    if (array1.length === array2.length) {
      return array1.every((element, index) => {
        if (element === array2[index]) {
          return true;
        }
  
        return false;
      });
    }
  
    return false;
  }
}





unit_tests()
function unit_tests(){
    //unit_test(solve_eqns,["x=4"],["x=4"])
    //unit_test(remove_vars,["x+3=y","x=2*y"],["x"])

}
//! crashes: ["x=c^2","c=x^2+f","y=x^2"]    



//console.log(solve_eqns(eqns))

//var eqns = ["x+y=4","x=2*y","z=3*y+x","z=2*x"]





// this would be used for substitution with blank outputs
// this will NOT throw an error if the substitution leads to a contradiction
function remove_vars(eqns,remove_vars){
    //! will have to put this in a try catch throw so users can understand the error, but for now I want to see the underlying error
    var stuff = back_solve(eqns,remove_vars)
    if(get_all_vars(stuff[2]).length===0){
        throw "removed too much"
    }else{
        return stuff[2] // the third element has all the remaining equations
    }

}
 
// it could just be done calling solve_eqns and getting the one you're trying to solve for, but this also works for solving in terms of other things
function solve_eqns_for(eqns,solve_for){
    if(solve_for.length===0){
        // return solve_eqns(eqns)
    }
    var sub_vars = excess(get_all_vars(eqns),solve_for)
    var stuff = back_solve(eqns,sub_vars)
    console.log(stuff)
    var sol = stuff[2]  // this is the stuff left over, which has everything in terms of solve_for
    if (intersection(get_all_vars(sol),solve_for).length===0){
        throw "cannot solve for"
    }

    // still have to check all the substituted equations are consistent:
    try{
        return solve_eqns(sol)
    }catch(err){
        throw "error remaining eqns: "+err
    }
}



function solve_eqns(eqns){

    var stuff = back_solve(eqns,get_all_vars(eqns))      
    var sols = stuff[0]

    // in a situtation like a+3=a+3, back solve doesn't produce anything (just has extra) so have to check if there are sol
    if (sols.length!==0){
        var last_sol = sols[sols.length-1] // this is the last solution that will be back subbed into the rest
        var last_vars = get_all_vars([last_sol])
        if(last_vars.length!==0){throw "too much unknown"}
    }

    var extra = stuff[2]    // these are the equations which are left over from substitutions, shouldn't have any variables    


    //! if im not using nerdamer i need some other way to check for contradictions (could just send it over to solve_eqn OR check in backsolve)
    extra.forEach((extra_eqn)=>{
        try{nerdamer(extra_eqn)}catch{throw "contradiction from nerdamer"} //! should probably be checked in back_solve so it will also lead to contradiction error   // if the equation is something like 3=4, nerdamer throws an error
        if (nerdamer(extra_eqn).variables().length!==0){throw "makes no sense O: from nerdamer"}
    })

    return forward_solve(stuff[0],stuff[1])
}




//! using regexp instead
/*
function get_all_vars(eqns){
    var all_vars = []
    eqns.forEach((eqn)=>{
        try{
            var vars = nerdamer(eqn).variables()
            all_vars.push(vars)
        }catch{}
         // if it's something like 0=1, throws an error, but no variables there anyway, and the error should get caught down the road
    })
    all_vars = all_vars.flat()
    all_vars = [...new Set(all_vars)] // gets unique values
    return all_vars
}
*/

function back_solve(eqns,sub_vars){

    if (sub_vars.length===0){return [[],[],eqns]}   // shouldn't be needed

    var ordered_vars = []
    var unordered_eqns = [...eqns] // this syntax gets the values not a reference
    var ordered_sols = []

    if(is_done()){return to_return()}


    for (let i=0;i<eqns.length;i++){
        //check_if_done() // this is performed in the beginning and end

        // get number of variables to solve in terms of for each 
        var new_vars = []
        var new_vars_len = []

        //! all this can be replaced with get_all_vars
        for (let j=0;j<unordered_eqns.length;j++){
            var eqn = unordered_eqns[j]
            try{var eqn_vars = nerdamer(eqn).variables().toString().split(",")}catch{throw "contradiction"}
            new_vars[j] = excess(eqn_vars,ordered_vars) //! probably don't need to use excess any more
            new_vars_len[j] = new_vars[j].length
        }

        // sort equations by number of variables to substitute for
        var new_vars_sorted = []
        var unordered_eqns_sorted = []
        // sort the eqns by the number of variables
        for (let j=0;j<unordered_eqns.length;j++){
            var idx = new_vars_sorted.findIndex(elem=>{return new_vars[j].length<elem.length})
            if (idx===-1){idx=new_vars_sorted.length}
            new_vars_sorted.splice(idx,0,new_vars[j])
            unordered_eqns_sorted.splice(idx,0,unordered_eqns[j])
        }

        // try solving repeatedly until it can find something it can solve (it would usually break on the very first iteration)
        // iterates through every equation and every substitution within the equation
        for (let j=0;j<unordered_eqns_sorted.length;j++){
            var eqn = unordered_eqns_sorted[j]
            var vars = new_vars_sorted[j]
            var found = false
            for (let k=0;k<vars.length;k++){
                if (!sub_vars.includes(vars[k])){continue}  //! could be replaced by getting the intersection of sub_vars and vars[k] and iterating through that
                try{var eqn_sol = solve_eqn(eqn,vars[k])}catch{throw "immediate contradiction error"} //! this can be replaced with sympy check
                if (is_complex(eqn_sol)){   //! can be replaced with sympy check
                    continue}
                var var_sel = vars[k]
                found = true    //! no longer would need to use this since the only thing causing it to skip over an equation would be it throwing an error
                break
            }
            if (found){
                break
            }
        }

        if(!found){
            throw "Cannot Solve (strange)"
        } // if it goes through every substitution for every equation, there's no way it can be solved




        if (eqn_sol.length===0){    // solve_eqn returns empty array if there's infinite solutions
            // if there's infinite solutions, the equation may still be useful, but you need to remove the useless variable by replacing it with a number
            var eqn_idx = unordered_eqns.indexOf(eqn)
            unordered_eqns[eqn_idx] = nerdamer(eqn).sub(var_sel,0.123).toString()   // not using 0 so I can clearly see what happened (and to avoid 1/0)
        }else{
            ordered_vars.push(var_sel)
            ordered_sols.push(eqn_sol) // INSTEAD OF EQN, NOW PUSHES THE EXPRESSION SO FORWARD_SOLVE DOESN'T NEED TO SOLVE
            unordered_eqns.splice(unordered_eqns.indexOf(eqn),1)
            // substitute the solution to all the other equations:
            for (let j=0;j<unordered_eqns.length;j++){
                unordered_eqns[j] = nerdamer(unordered_eqns[j]).sub(var_sel,eqn_sol).toString()
            }
        }

        console.log([[...ordered_sols],[...ordered_vars],[...unordered_eqns]])
        if(is_done()){return to_return()}
    }

    throw "cannot finish solving after going through all eqns (SHOULD NOT HAPPEN)"



    // moving these outside because they're called in the beginning and end of loop (keeps the behavior more consistent)
    function is_done(){
        return intersection(get_all_vars(unordered_eqns),sub_vars).length===0 // excess(sub_vars,ordered_vars).length===0  ||){
    }
    function to_return(){
        return [ordered_sols,ordered_vars,unordered_eqns]
    }
}

function forward_solve(ordered_sols,ordered_vars){
    // this would be called after order_solve, used to get numeric values only

    // reverse arrays since you end with a numeric solution in order solve
    ordered_sols.reverse()
    ordered_vars.reverse()
    // first step back substitute
    for (let i=0;i<ordered_sols.length;i++){
        var eqn = ordered_sols[i]
        var var_sel = ordered_vars[i]
        var sol = eqn 

        for (let j=0;j<ordered_sols.length;j++){
            if (i!==j){
                ordered_sols[j] = nerdamer(ordered_sols[j]).sub(var_sel,sol).toString()    //! replace with sub_vars
            }
        }
    }
    

    var sol_eqns = []
    // final step is just to solve for the variable:
    for (let i=0;i<ordered_sols.length;i++){
        var sol = ordered_sols[i]
        var solve_var = ordered_vars[i]
        sol_eqns[i] = solve_var+"="+sol//solve_eqn(eqn,solve_var)
    }
    return sol_eqns
}


//! certain equations return complex numbers even when there are real solutions (e.g. 1=1/x+x^2/20)
function solve_eqn(eqn,solve_var){
    // complex numbers popped up in the hydraulic case, but not with small tests



    // im putting error messages in arrays just so stuff using the function can check if it's an error by checking the type
    eqn = nerdamer(eqn)
    try{var sol = eqn.solveFor(solve_var)}catch{throw "eqn contradiction"} // if can't solve, no solution
    //if (sol.length===0){throw "no solution"}                        // if no solutions, no solution

    //  a=3: nerdamer gives value, a+3=5: nerdamer gives array, very stupid
    if (Array.isArray(sol) && sol.length!==0){
        sol = sol[0]
    }


    // sol = sol.sub("i","1")


    // if there's infinite solutions, it returns 0 or empty string, so I add one to the variable and see if it still returns 0:
    if (sol.toString()==="0"){
        var eqn_check = eqn.sub(solve_var,solve_var+"+1")
        if (eqn_check.solveFor(solve_var).toString()==="0"){
            var infinite = true
        }
    }else if(sol.toString()===""){
        var infinite = true
    }else{
        var infinite = false
    }
    // evaluate returns a fraction not decimal, so I need eval
    if(infinite){
        return []
    }else{
        return sol.evaluate().toString() //! EVAL IS DANGEROUS, but my way to convert to decimal (since it doesn't look like nerdamer can)
    }
}

// not needed
function is_complex(eqn_txt){
    var eqn = nerdamer(eqn_txt)
    return (eqn.sub("i","boop").toString()!==eqn.toString())
}


function excess(A,B){
    // if it's one variable, nerdamer doesn't use an array, so this puts it in an array:
    if (typeof(A)==="string"){A=[A]}
    if (typeof(B)==="string"){B=[B]}
  
    var extras = []
  
    var extras = A.filter(
      function(i){
        return this.indexOf(i)<0;
  
      },
      B
    )
    return extras
  }

function intersection(A,B){
    return A.filter(value => B.includes(value));

}

// not needed
function get_dec(val){
    var dec_places = 2
    var num_den = val.split("/")
    if (num_den.length===1){
        var val = parseFloat(num_den[0])
    }else{
        var val = parseFloat(num_den[0]/num_den[1])
    }
    var dec_val = Math.round(val*10**dec_places)/10**dec_places
    return dec_val.toString()
}



function sub_vars(exp,sub_in,sub_out){
    // for now this is only used in the table substitution (so not in this file) so it doesn't lead to an error for stuff like 3=4, and it doesn't do any evaluation

    var in_len = sub_in.length
    for (let i=-1;i<exp.length;i++){
        if (i==-1){
            var start = "-" // just some character that's not alphanumeric
        }else{
            var start = exp[i]
        }
        var str = exp.substring(i+1,i+1+in_len)

        if (i+1+in_len===exp.length){
            var end = "-"
        }else{
            var end = exp[i+1+in_len]
        }
        
        if (/\W/.test(start) && /\W/.test(end) && str===sub_in){
            console.log('hi')
            var exp = exp.substring(0,i+1)+sub_out+exp.substring(i+1+in_len,exp.length)
        }
    }
    
    return exp
}

function get_all_vars(eqns){
    var regex = /\W([a-zA-Z]\w?)+/g
    var vars = []
    eqns.forEach((eqn)=>{
        txt = "-"+eqn+"-"
        var matches = [...txt.matchAll(regex)]
        var eqn_vars = []
        matches.forEach(match=>{
            var var_txt = match[0].substring(1)
            eqn_vars.push(var_txt)
        })
        vars.push(eqn_vars)
    })
    return [...new Set(vars.flat())]
}

function add_lead_zero(exp){
    if (exp[0]==="."){
        exp = "0"+exp
    }
    for (let i=0;i<exp.length;i++){
        var not_alpha_num = exp[i]
        var dec_point = exp[i+1]

        if (/\W/.test(not_alpha_num)&&dec_point==="."){
            var exp = exp.substring(0,i+1)+"0"+exp.substring(i+1,exp.length)
        }
    }
    return exp
}





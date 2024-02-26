

const space = "SP__"

const back_slash = "BS__"

const open_brace = "OB__"
const closed_brace = "CB__"

const greek_letters = [
	'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota',
	'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau',
	'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega', 'alpha', 'beta', 'gamma', 'delta',
	'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi',
	'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'
	]; // TODO now in three different places............

function add_char_placeholders(eqn){

	eqn = eqn.replaceAll("\\max","max")
	eqn = eqn.replaceAll("\\min","min")
	eqn = eqn.replaceAll("\\deg","deg")

    greek_letters.forEach(letter => {
        const before = "\\"+letter


        const boop = before+" "
        const boop_after = before+space
        eqn = eqn.replaceAll(boop, boop_after)


        const after = back_slash+letter
        eqn = eqn.replaceAll(before, after)

    })


    const eqn_split = eqn.split("")

    for (let i=0;i<eqn_split.length;i++){
        const char1 = eqn_split[i]
        const char2 = eqn_split[i+1]

        if (char1 === "_" && char2 === "{"){
            const open_idx = i+1
            const closed_idx = find_closed_brace(eqn_split, open_idx)
            eqn_split[open_idx] = open_brace
            eqn_split[closed_idx] = closed_brace
        }
    }

    eqn = eqn_split.join("")
    return eqn
}


function find_closed_brace(txt,open_idx){
    //! basically copying from cas (for brace instead of parentheses), but it's fineeeeeeee
    if (txt[open_idx]!=="{"){throw "needs to be open brace"}

	var idx = open_idx
	var level_count = 0

	while (true){
		idx += 1

		if (idx===txt.length){throw "no closed brace"}

		if (txt[idx]==="{"){
			level_count+=1
		}else if(txt[idx]=="}"){
			level_count-=1
		}


		if(level_count<0){
			return idx
		}
		
	}

}

function remove_char_placeholders(eqn){
    eqn = eqn.replaceAll(space," ")
    eqn = eqn.replaceAll(back_slash,"\\")
    eqn = eqn.replaceAll(open_brace,"{")
    eqn = eqn.replaceAll(closed_brace,"}")
    return eqn
}





function do_other_syntax_checks(latex_expression){

	// this is awful
	// but not as scary cause it just throws errors, so ill know if it's misbehaving


	const invalid_chars = "`'!@#$%&[]~"

	for (char of invalid_chars){
		if (latex_expression.includes(char)){
			throw new FormatError(`${char} is not allowed in an equation`)
		}
	}



	latex_expression = latex_expression.replaceAll("BS"," ")

	trig_funcs.forEach(op => {
		
		if (op[0] === "a"){
			op = "arc"+op.slice(1)
		}

		const latex_op = "\\\\"+op

		const exponent_trig = RegExp(latex_op+"[\\^]","g")
		const non_parentheses_trig = RegExp(latex_op+"[ ]","g")

		if (exponent_trig.test(latex_expression)){
			throw new FormatError("only supports trig exponents after the closed parentheses")
		}

		const without_parentheses = non_parentheses_trig.test(latex_expression) || latex_expression.endsWith(op)

		if (without_parentheses){
			throw new FormatError("trig function input must be enclosed in parentheses")
		}

	})


	/*
	forbid

		\\trigfunc^

		\\trigfuncanything other than parentheses
	*/
}


function ltx_to_math(ltx_eqn){


	let eqn = ltx_eqn 

	eqn = eqn.replaceAll("BS__pi",Math.PI.toString())

	eqn = eqn.replaceAll(" ","")

	eqn = eqn.replaceAll("\\arc","a")

	eqn = eqn.replaceAll("}{","}/{")
	// insert * after } for all cases of } followed by letter or number
	// gets rid of issues for something like \frac{1}{2}a which would otherwise be (1)/(2)b and would be interpreted as 1/(2*a) down the road
	eqn = eqn.replace(/}(?=[a-zA-Z0-9])/g, '}*');


	// check if there's any invalid variables, numbers immediately followed by letters
	const invalid_var = /[^a-zA-Z0-9_][0-9][a-zA-Z_]/;
	const invalid_var_start = /^[0-9][a-zA-Z_]/;
	if (invalid_var.test(eqn) || invalid_var_start.test(eqn)){
		throw new FormatError("cannot start a variable with a number")
	}

		
	eqn = eqn
		.replaceAll("\\left(","{")
		.replaceAll("\\right)","}")

	const invalid_closed_paren = /\)[0-9a-zA-Z]/
	const invalid_open_paren = /[0-9a-zA-Z]\(/

	if (invalid_closed_paren.test(eqn) || invalid_open_paren.test(eqn)){
		//throw new FormatError("must have operation between parentheses and variable/number")
	}
	


	// add  leading 0 (nerdamer cant handle .1 for example)
	var str_arr = eqn.split("")

	for (let i=0;i<str_arr.length;i++){
		if (str_arr[i]==="." && !(/[0-9]/.test(str_arr[i-1]))){
			str_arr.splice(i,1,"0.")
		}
	}
	eqn = str_arr.join("")

	
	
	eqn = eqn
		.replaceAll("{","(")
		.replaceAll("}",")")




	eqn = eqn
	.replaceAll("\\frac","")
	.replaceAll("\\cdot","*")
	.replaceAll("\\sqrt","sqrt")
	.replaceAll("{","(")
	.replaceAll("}",")")






	const ltx_trig_funcs = trig_funcs.map(func => {return "\\"+func})


	trig_funcs.forEach((_,idx)=> {
		eqn = eqn.replaceAll(ltx_trig_funcs[idx],trig_funcs[idx])
	})



	// check if there's invalid math synatix, e.g a=b+
	exps = eqn.split("=")
	exps.forEach(exp=>{
		try{math.parse(exp.replaceAll("\\",""))}	// need to remove backslashes for greek letters
		catch{throw new FormatError("Invalid equation")}
	})


	return eqn


}



function find_open_paren(txt,closed_idx){

	if (txt[closed_idx]!==")"){throw "needs to be open paren"}

	var idx = closed_idx
	var level_count = 0

	while (true){
		idx -= 1

		if (idx===txt.length){throw "no closed parentheses"}

		if (txt[idx]==="("){
			level_count+=1
		}else if(txt[idx]==")"){
			level_count-=1
		}


		if(level_count>0){
			return idx
		}
		
	}

}




function find_var_end(txt,start_var_idx){

	let idx = start_var_idx
	while (true){
		if (txt.length === idx){
			return idx
		}
		idx += 1

		const char = txt[idx]
		const is_alpha_num = /^[a-zA-Z0-9]+$/.test(char)
		const pow_terms = ["{","}","^"]
		if (!is_alpha_num && !pow_terms.includes(char)){
			return idx
		}
	}
}


function find_var_start(txt,end_var_idx){

	let idx = end_var_idx


	while (true){
		if (idx === 0){
			return idx
		}
		idx -= 1

		const char = txt[idx]
		const is_alpha_num = /^[a-zA-Z0-9]+$/.test(char)
		const pow_terms = ["{","}","^"]

		if (!is_alpha_num && !pow_terms.includes(char)){
			return idx+1
		}
	}
}


function all_indices(str, char) {
	const indices = [];
	let index = str.indexOf(char);
	while (index !== -1) {
	  indices.push(index);
	  index = str.indexOf(char, index + 1);
	}
	return indices;
}


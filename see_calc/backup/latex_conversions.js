

/*

no longer needed now that converting tree to an equation can convert to latex

*/

const greek_letters = [
	'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota',
	'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau',
	'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega', 'alpha', 'beta', 'gamma', 'delta',
	'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi',
	'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'
	];


const trig_funcs = ["sin", "cos", "tan", "csc", "sec", "cot", "sinh", "cosh", "tanh", "csch", "sech", "coth",
					'asin', 'acos', 'atan', 'acsc', 'asec', 'acot', 'asinh', 'acosh', 'atanh', 'acsch', 'asech', 'acoth']



function ltx_to_math(ltx_eqn){


	let eqn = ltx_eqn 

	eqn = eqn.replaceAll(" ","")


	// insert * after } for all cases of } followed by letter or number
	// gets rid of issues for something like \frac{1}{2}a which would otherwise be (1)/(2)b and would be interpreted as 1/(2*a) down the road
	eqn = eqn.replace(/}(?=[a-zA-Z0-9])/g, '}*');


	// check if there's any invalid variables, numbers immediately followed by letters
	const invalid_var = /\d(?=[a-zA-Z])/;
	if (invalid_var.test(eqn)){
		throw "variables must not start with numbers"
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
		.replaceAll("\\left(","{")
		.replaceAll("\\right)","}")


		.replaceAll("{","(")
		.replaceAll("}",")")



	const start_frac_idxs = find_all_end_idxs(eqn,"frac\\(")


	for (let i=0;i<start_frac_idxs.length;i++){
		start_idx = start_frac_idxs[i]
		shifted_start_idx = start_idx+i // accounts for the fact that the previous insertions shifts the index over
		mid_idx = find_closed_paren(eqn,shifted_start_idx)+1

		eqn = eqn.slice(0,mid_idx)+"/"+eqn.slice(mid_idx)
	}



	eqn = eqn
	.replaceAll("\\frac","")
	.replaceAll("\\cdot","*")
	.replaceAll("\\sqrt","sqrt")
	.replaceAll("{","(")
	.replaceAll("}",")")

	const greek_in = greek_letters.map(letter=>{return "\\"+letter})
	const greek_out = greek_letters.map(letter=>{return "GREEK"+letter})

	greek_in.forEach((_,i)=>{
		eqn = eqn.replaceAll(greek_in[i],greek_out[i])
	})


	// the remaining slashes are just for trig functions and can just be removed
	eqn = eqn.replaceAll("\\","")


	// remove unneeded parentheses, e.g. (a)*(b)
	// messes up sin cos sqrt etc though
	// eqn = eqn.replace(/\((\w+)\)/g, (match, capturedGroup) => capturedGroup);
	

	// check if there's invalid math synatix, e.g a=b+
	exps = eqn.split("=")
	exps.forEach(exp=>{
		try{math.parse(exp)}
		catch{throw "Invalid equation"}
	})


	return eqn


}



function find_all_end_idxs(txt,sub){
	const regex = new RegExp(sub,'g')
	let match
	const indices = []
	while ((match = regex.exec(txt)) !== null) {
		indices.push(match.index + match[0].length - 1);
	}
	return indices
}



function find_closed_paren(txt,open_idx){
	if (txt[open_idx]!=="("){throw "needs to be open paren"}

	var idx = open_idx
	var level_count = 0

	while (true){
		idx += 1

		if (idx===txt.length){throw "no closed parentheses"}

		if (txt[idx]==="("){
			level_count+=1
		}else if(txt[idx]==")"){
			level_count-=1
		}


		if(level_count<0){
			return idx
		}
		
	}

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


function math_to_ltx(eqn){

	if (eqn.includes("VISUAL")){return eqn}
	/*

	nerdamer convertToLaTeX has an issue where it sometimes creates nested fraction when it's not needed

	e.g. nerdamer.convertToLaTeX('b^(-1)*c^(-1)') --> '\frac{\frac{1}{{b}^{1}}}{{c}^{1}}'



	for exponents and fractions, need to add in braces

	then remove unneeded parentheses

	TODO would like to have it combine terms to fraction, e.g. a^1*b^-1 --> a/b
	
	
	(a+b)/(c+d)
		
	
	*/	

	

	
	if (eqn.includes("VISUAL")){return eqn} // TODO pretty format the visual equation

	eqn = eqn.replaceAll(" ","")

	



	// TODO remove the pi/180 and 180/pi trig conversion factors

	// TODO remove uneeded parentheses


	eqn = eqn.replaceAll("*","\\cdot ")

	let eqn_arr = eqn.split("")






	const frac_idxs = all_indices(eqn,"/")


	frac_idxs.reverse() // reversing the iteration order prevents insertions and deletions from changing the indices


	// TODO this code fails in cases like "a/b^(d+c)" since it find_var_end doesn't realize the parentheses are part of the exponent
	frac_idxs.forEach(idx=>{
		const start_den_idx = idx+1


		const den_par_bound = eqn_arr[start_den_idx]==="("

		if (den_par_bound){
			const end_den_idx = find_closed_paren(eqn,start_den_idx)
			
			eqn_arr.splice(end_den_idx,1,"}")
			eqn_arr.splice(start_den_idx,1,"{")

		}else{
			const end_den_idx = find_var_end(eqn,start_den_idx)

			eqn_arr.splice(end_den_idx,0,"}")
			eqn_arr.splice(start_den_idx,0,"{")
		}

		const end_num_idx = idx-1


		const num_par_bound = eqn_arr[end_num_idx]===")"

		if (num_par_bound){
			const start_num_idx = find_open_paren(eqn_arr,end_num_idx)

			eqn_arr.splice(end_num_idx,1,"}")
			eqn_arr.splice(start_num_idx,1,"\\frac{")
		}else{
			const start_num_idx = find_var_start(eqn_arr,end_num_idx)

			eqn_arr.splice(end_num_idx+1,0,"}")
			eqn_arr.splice(start_num_idx,0,"\\frac{")
		}


	})

	eqn = eqn_arr.join("")


	const pow_idxs = all_indices(eqn,"^")

	pow_idxs.forEach(idx=>{
		const open_idx = idx+1
		if (eqn[open_idx]!=="("){return}
		const closed_idx = find_closed_paren(eqn,open_idx)
		eqn[open_idx] = "{"
		eqn[closed_idx] = "}"
	})




	eqn = eqn.replaceAll("/","")

	

	eqn = eqn.replaceAll("(","\\left(")
	eqn = eqn.replaceAll(")","\\right)")



	eqn = eqn.replaceAll("sqrt","\\sqrt")

	// TODO check that the trig functions are not part of a larger variable



	trig_funcs.forEach(str=>{
		const new_str = "\\mathrm{"+str+"}"
		eqn = eqn.replaceAll(str,new_str)
	})


	//eqn = nerdamer.convertToLaTeX(eqn)


	
	const greek_letters_math = greek_letters.map(letter=>{return "GREEK"+letter})

	const regex = new RegExp(greek_letters_math.join('|'), 'g');
	
	// Replace the matched substrings with the substring followed by a space
	eqn = eqn.replace(regex, match => match.replace("GREEK","\\") + ' ');
	



	return eqn

	

}


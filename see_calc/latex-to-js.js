function ltx_to_math(ltx_eqn){


	let eqn = ltx_eqn 

	eqn = eqn.replaceAll(" ","")

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
	.replaceAll("\\","GREEK")
	.replaceAll("{","(")
	.replaceAll("}",")")


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


function math_to_ltx(eqn){
	/*

	nerdamer convertToLaTeX has an issue where it sometimes creates nested fraction when it's not needed

	e.g. nerdamer.convertToLaTeX('b^(-1)*c^(-1)') --> '\frac{\frac{1}{{b}^{1}}}{{c}^{1}}'



	for exponents and fractions, need to add in braces

	then remove unneeded parentheses

	TODO would like to have it combine terms to fraction, e.g. a^1*b^-1 --> a/b
	
	
	(a+b)/(c+d)
		
	
	*/	


	
	eqn = eqn.replaceAll(" ","")
	eqn = nerdamer.convertToLaTeX(eqn)

	let greek_letters = [
	'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota',
	'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau',
	'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega', 'alpha', 'beta', 'gamma', 'delta',
	'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi',
	'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'
	];
	
	greek_letters = greek_letters.map(letter=>{return "GREEK"+letter})

	const regex = new RegExp(greek_letters.join('|'), 'g');
	
	// Replace the matched substrings with the substring followed by a space
	eqn = eqn.replace(regex, match => match.replace("GREEK","\\") + ' ');
	



	return eqn

	

}


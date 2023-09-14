




function ltx_to_math(ltx_eqn){


	let eqn = ltx_eqn 

	eqn = eqn.replaceAll(" ","")

	eqn = eqn.replaceAll("\\arc","a")

	eqn = eqn.replaceAll("}{","}/{")
	// insert * after } for all cases of } followed by letter or number
	// gets rid of issues for something like \frac{1}{2}a which would otherwise be (1)/(2)b and would be interpreted as 1/(2*a) down the road
	eqn = eqn.replace(/}(?=[a-zA-Z0-9])/g, '}*');


	// check if there's any invalid variables, numbers immediately followed by letters
	const invalid_var = /\d(?=[a-zA-Z])/;
	if (invalid_var.test(eqn)){
		throw new FormatError("numbers must be at the end of variables")
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







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


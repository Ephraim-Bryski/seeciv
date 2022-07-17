function compare_data(A,B){
    // checks if two nested arrays have the same data
    var Akeys = Object.keys(A)
    var Bkeys = Object.keys(B)

    if (Akeys.length>Bkeys.length){var ref_keys = Akeys}
    else{var ref_keys = Bkeys}

    console.log(ref_keys)

    var match = true

    ref_keys.forEach(key=>{
        console.log(key)
        A_in = A[key]
        B_in = B[key]
        if (typeof A_in === "object" && typeof B_in === "object"){
            if(compare_data(A_in,B_in)){
                console.log("Objects match: "+A_in+" and "+B_in)
            }else{
                console.log("Objects don't match: "+A_in+" and "+B_in)
                match = false
            }
        }else if(A_in===B_in){
            console.log("Elements match: "+A_in+" and "+B_in)
        }else{
            console.log("Elements don't match: "+A_in+" and "+B_in)
            match = false
        }
    })
    return match
}

console.log(compare_data([2,{a: 4,b: 3,c: [1,8]}],[2,{a: 4,b: 3,c:[1,6]}]))
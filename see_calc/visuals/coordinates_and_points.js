
const greek_symbols = ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ", "λ", "μ", "ν", "ξ", "ο", "π", "ρ", "σ", "τ", "υ", "φ", "χ", "ψ", "ω"]
const greek_latex = ["\\alpha", "\\beta", "\\gamma", "\\delta", "\\epsilon", "\\zeta", "\\eta", "\\theta", "\\iota", "\\kappa", "\\lambda", "\\mu", "\\nu", "\\xi", "\\omicron", "\\pi", "\\rho", "\\sigma", "\\tau", "\\upsilon", "\\phi", "\\chi", "\\psi", "\\omega"]

function round(value){
    const n_places = 2
    return Math.round(value*10**n_places)/10**n_places
}


const draw_coordinate_2d = {
    name: "Coordinate2D",
    vars: {
        x: 0,
        y: 0
    },
    vis:(inp) => {

        draw_coordinate(inp.x,inp.y,0,`(${round(inp.x)},${round(inp.y)})`)
    }
}




const draw_coordinate_3d = {
    name: "Coordinate3D",
    vars: {
        x: 0,
        y: 0,
        z: 0
    },
    vis:(inp) => {

        draw_coordinate(inp.x,inp.y,inp.z,`(${round(inp.x)},${round(inp.y)},${round(inp.z)})`)
        
    }
}


const draw_axes_2d ={
    name: "Axes2D",
    vars: {
        x_0: 0,
        y_0: 0,
        //! need to decide how it will now it needs to be text input
            // either make "text" or "label" magic like with color, or have another parameter
        "x_{label}": '"x"',
        "y_{label}": '"y"',
        "x_{length}": 1,
        "y_{length}": 1
    },
    vis: (inp) => {

        const x0 = inp.x_0
        const y0 = inp.y_0
        const xtext = inp["x_{label}"].replaceAll('"','')
        const ytext = inp["y_{label}"].replaceAll('"','')
        const xlength = inp["x_{length}"]
        const ylength = inp["y_{length}"]

        const origin = [x0,y0,0]
        const texts = [xtext,ytext]
        const lengths = [xlength,ylength]
    
        draw_axes(origin,texts,lengths)

    }
}

const draw_axes_3d ={
    name: "Axes3D",
    vars: {
        x_0: 0,
        y_0: 0,
        z_0: 0,
        //! need to decide how it will now it needs to be text input
            // either make "text" or "label" magic like with color, or have another parameter
        "x_{label}": '"x"',
        "y_{label}": '"y"',
        "z_{label}": '"z"',
        "x_{length}": 1,
        "y_{length}": 1,
        "z_{length}": 1
    },
    vis: (inp) => {

        const x0 = inp.x_0
        const y0 = inp.y_0
        const z0 = inp.z_0

        const xtext = inp["x_{label}"].replaceAll('"','')
        const ytext = inp["y_{label}"].replaceAll('"','')
        const ztext = inp["z_{label}"].replaceAll('"','')

        const xlength = inp["x_{length}"]
        const ylength = inp["y_{length}"]
        const zlength = inp["z_{length}"]

        const origin = [x0,y0,z0]
        const texts = [xtext,ytext,ztext]
        const lengths = [xlength,ylength,zlength]
    
        draw_axes(origin,texts,lengths)

    }
}



function draw_coordinate(x,y,z,text){
    // just internal function, not exposed to user

    position = vec(x,y,z)
    points({pos:[position]})
    label({pos: position, text: text, align: 'left', box: false, opacity: 0,height:12,xoffset:5,yoffset:5,line:false})
}    



function draw_axes(origin,texts,lengths){

    // just internal function, not exposed to user


    const axes = ["x","y","z"]

    const offset_keys = axes.map(axis => {return axis+"offset"})

    for (let i=0;i<texts.length;i++){
        
        const axis = axes[i]

        const text = remove_char_placeholders(texts[i])

        const p1 = vec(...origin)
        p1[axis] -= lengths[i]

        const p2 = vec(...origin)
        p2[axis] += lengths[i]

        let symbol_text
        const idx = greek_latex.indexOf(text)
        if (idx === -1){
            symbol_text = text
        }else{
            symbol_text = greek_symbols[idx]
        }


        const offset_key = offset_keys[i]
        const label_input = {'text': symbol_text, 'pos': p2, height: 18, box: false, border:2, line: false}
        label_input[offset_key] = 5

        label(label_input)

        curve({pos:[p1,p2],emissive:true})



    }

}


vis_blocks.push(draw_coordinate_2d)
vis_blocks.push(draw_coordinate_3d)
vis_blocks.push(draw_axes_2d)
vis_blocks.push(draw_axes_3d)
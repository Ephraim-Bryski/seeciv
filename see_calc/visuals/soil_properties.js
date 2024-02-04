

const draw_soil_properties = {
    "name": "SoilProperties",
    "vars": {
        "V_s": 1,
        "V_w": 1,
        "V_a": 1,
        "D": 1,
    },



    vis: (inp)=>{

        const radius = inp.D/2

        function get_height(volume){
            return volume/(Math.PI*radius**2)
        }

        const solid_H = inp.v_S.map(get_height)
        const water_H = inp.V_w.map(get_height)
        const air_H = inp.V_a.map(get_height)

        
        const solid_color = vec(0.6,0.16,0.16)
        const water_color = vec(0,0,0.7)
        const air_color = color.white
        
        
        solid_pos = vec(0,0,0)
        water_pos = vec(0,solid_H,0)
        air_pos = vec(0,solid_H+water_H,0)
        
        solid_axis = vec(0,solid_H,0)
        water_axis = vec(0,water_H,0)
        air_axis = vec(0,air_H,0)
        
        cylinder({radius:radius, pos:solid_pos,axis:solid_axis,color:solid_color})
        cylinder({radius:radius, pos:water_pos,axis:water_axis,color:water_color})
        cylinder({radius:radius, pos:air_pos,axis:air_axis,color:air_color,opacity:0.5})

    }
}

vis_blocks.push(draw_soil_properties)
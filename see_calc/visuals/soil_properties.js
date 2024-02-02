

const draw_soil_properties = {
    "name": "SoilProperties",
    "vars": {
        "V_s": solid,
        "V_w": water,
        "V_a": air,
        
    }
}

    make_soil_properties(1,2,1,1,1)
    function make_soil_properties(solid,water,air,D){

        const radius = D/2

        const solid_color = vec(0.6,0.16,0.16)
        const water_color = vec(0,0,0.7)
        const air_color = color.white


        const solid_H = solid
        const water_H = water
        const air_H = air

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


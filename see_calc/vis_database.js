// basically just a json file, read in compute_sheet for computing (imported in py_worker), and later in see_calc for actually making the visuals (imported in see_calc.html)





function get_vis_func(vis_name){

    vis_blocks.filter(block=>{return block.name === vis_name})

    if (vis_blocks.length === 0){throw "no visuals with name "+vis_name}

    return vis_blocks[0].vis

}

vis_blocks = []
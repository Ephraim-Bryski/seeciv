const my_plot = {
    name: "Plot",
    vars: {
        x: "x",
        y: "y",
        "x_{min}": 0,
        "x_{max}": 1
    },
    plot_independent: ["x"],
    plot_dependent: "y",
    vis: (inp) => {
        
        lets_do_some_plotting(inp.y, inp.x, inp["x_{min}"], inp["x_{max}"])
    }
}

vis_blocks.push(my_plot)



function lets_do_some_plotting(expression, variable, x_min, x_max){

    const n_steps = 100

    function linspace(start, end, steps) {
        const stepSize = (end - start) / (steps - 1);
        return Array.from({ length: steps }, (_, index) => start + index * stepSize);
    }

    const x_values = linspace(x_min, x_max, n_steps)

    const positions = x_values.map(x => {
        //! for now assuming expression's in terms of x
        y = math.evaluate(sub_all_vars(expression,[variable],[x]))
        //! need to handle infinite / nan
        return vec(x,y,0)
    })


    curve({pos: positions})
}
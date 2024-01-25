
const adjust_field = document.createElement('span')

const lower_bound = document.createElement('input');
lower_bound.type = 'number';
lower_bound.value = 0

const slider = document.createElement('input');
slider.type = 'range';
slider.id = "boop"
const upper_bound = document.createElement('input');
upper_bound.type = 'number';
upper_bound.value = 10

adjust_field.appendChild(lower_bound)
adjust_field.appendChild(slider)
adjust_field.appendChild(upper_bound)

const adjust_elements = [lower_bound,slider,upper_bound]

adjust_elements.forEach(element => {
    element.addEventListener('input',boop)
})

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))



async function boop (){

    await sleep(240)
    
    do_stuff()
    function do_stuff(){
        console.log('done :)')
        const lower = parseFloat(lower_bound.value)
        const percentage = parseFloat(slider.value)
        const upper = parseFloat(upper_bound.value)
    
        const value = (upper-lower)*percentage/100+lower
        console.log(`value: ${value}`)
    }
    
}




document.body.appendChild(adjust_field);

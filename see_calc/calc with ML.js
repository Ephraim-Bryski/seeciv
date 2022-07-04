
var useML=true

//var MQ = MathQuill.getInterface(2);



if (!useML){
    setup()
    var SoEs= [
        {
            name:"System",
            
            eqns: [
            {input: "a=b+3", result: "",display:""},
            {input: "a*b=4", result: "",display:""}
            
            ]
        },
        {
            name:"AnotherSystem",
            eqns: [
            {input: "solve System for a", result:"",display:""},
            {input: "c=4",  result:"",display:""}
                
            ]
        },
        {
            name:"AndAnother",
            eqns: [
            {input: "AnotherSystem sub a:c", result:"",display:""},
            
                
            ]
        },
        {
            name:"AndAContradiction",
            eqns: [
            {input: "solve AndAnother", result:"",display:""},
            
                
            ]
        },


    ]
    data2DOM(SoEs)
}




function setup(htmlComponent) {
    document.addEventListener('keyup', (e)=>{
        if (e.code=="Enter"){
            var in_field=document.activeElement
            if(in_field.className=="line-input"){
                var line=in_field.parentNode
                var block=line.parentNode
                var next_line=line.nextElementSibling
                var new_line=make_line()
                block.insertBefore(new_line,next_line)
                new_line.children[1].focus()
            }else if(in_field.className=="block-name-txt"){
                var block=in_field.parentNode.parentNode
                var main=block.parentNode
                var next_block=block.nextElementSibling
                var new_block=make_block()
                main.insertBefore(new_block,next_block)
                new_block.children[0].children[1].focus()
            }
            
                
    }})
    document.addEventListener('keyup', (e)=>{
        if (e.code=="Enter" && e.ctrlKey){
            
            update_data(false,false)          
    }})



    var save_btn=document.getElementById("save-btn")
    save_btn.addEventListener("click", function(){
        update_data(true,false)
    });


    var load_btn=document.getElementById("load-btn")
    load_btn.addEventListener("click", function(){
        update_data(false,true)
    });


    if (useML){
        htmlComponent.addEventListener("DataChanged", function(event) { 
            data2DOM(htmlComponent.Data)})       
    }



    function update_data(save,load){  
  
        if (save){
            var save_txt=document.getElementById("save-file-name").value
        }else{
            var save_txt=[]
        }


        if(load){
            var load_txt=document.getElementById("load-file-name").value
        }else{
            var load_txt=[]
        }

        var sheet_data=DOM2data()

        var ML_package={data: sheet_data, save_name: save_txt, load_name: load_txt}
        if(useML){
            htmlComponent.Data=ML_package
        }else{
            console.log(ML_package)
            data2DOM(sheet_data)
        }
    }
}
    




data2DOM(SoEs)


function DOM2data(){
    //! needs changes!
    data=[]
    var outer=document.getElementById('root')
    var not_empty_box_count=0;
    for (let i=0;i<outer.children.length;i++){
        
        var SoE_box=document.getElementsByClassName('block')[i]
        var name_field = document.getElementsByClassName('block-name-txt')[i].value

        if (name_field.length!=0){
            data[not_empty_box_count]={}
            data[not_empty_box_count].name=name_field
            data[not_empty_box_count].eqns=[]
            var not_empty_line_count=0
            for (let j=1;j<SoE_box.children.length;j++){
                var eqn_row=SoE_box.children[j]
                var input=eqn_row.children[1].value
                if(input.length!=0){
                    data[not_empty_box_count].eqns[not_empty_line_count]={}
                    data[not_empty_box_count].eqns[not_empty_line_count].input=input
                    not_empty_line_count+=1
                }
                
    
    
            }
            not_empty_box_count+=1
        }
        
    }
    return data
}



function data2DOM(SoEs){
    var main = document.getElementById('root');
    while(main.firstChild){
        main.removeChild(main.firstChild);
    }


    if(!Array.isArray(SoEs)){
        SoEs=[SoEs]
    }


    for (let i=0;i<SoEs.length;i++){    
        main.appendChild( make_block(SoEs[i]))  
    }

}


function make_line(eqn){
    var line=document.createElement('div')

    


    var remove_button=document.createElement('button')
    remove_button.innerHTML="X"
    remove_button.onclick=function(event){
        var button=event.target
        var line=button.parentNode
        var outer=line.parentNode

        if (outer.children.length>2){ // one for the name and one for the remaining line
            outer.removeChild(line)
        }
        
    }
    remove_button.className="line-btn"
    remove_button.classList.add("remove-btn")

    var in_field=document.createElement('input')
    in_field.className="line-input"
    


    var out_field=document.createElement('span')


    if (eqn!=undefined){
        in_field.value=eqn.input
        out_field.innerHTML=eqn.display
        //MQ.StaticMath(out_field)
    }






    line.appendChild(remove_button)
    line.appendChild(in_field)
    line.appendChild(out_field)
    return line
}


function make_block(SoE){

    var block=document.createElement('div')

    block.className="block"

    var remove_button=document.createElement('button')
    remove_button.onclick=function(event){
        var button=event.target
        var block=button.parentNode.parentNode
        var outer=block.parentNode

        if (outer.children.length>1){ // one for the name and one for the remaining line
            outer.removeChild(block)
        }
    }
    remove_button.innerHTML="X"
    remove_button.className="block-remove"
    remove_button.classList.add("remove-btn")

    var name_field=document.createElement('input')
    name_field.className="block-name-txt"

    name_line=document.createElement('div')
    name_line.className="block-name"
    name_line.appendChild(remove_button)
    name_line.appendChild(name_field)
    block.appendChild(name_line)


    if (SoE!=undefined){
        name_field.value=SoE.name

        var eqns=SoE.eqns
    
        if(!Array.isArray(eqns)){
            eqns=[eqns]
        }
    
    
        for (let j=0;j<eqns.length;j++){
            
            block.appendChild(make_line(eqns[j]))
            
    
        }
    }else{
        block.appendChild(make_line())
    }
    

    return block
}




/*

a bit of an issue where i either
    include the eqn tau=(m2-m1)/delta in the visual and the sheet
    don't have the eqn, but then you could get impossible things if it's not linked to the eqn

    honestly prefer the latter, the former breaks the whole approach

    in theory i could make the arrows primitives but that would get way too messy, since u cant pass expressions ):
*/


const draw_beam = {
    name: "Beam",
    vars: {
        x_1: 0,
        x_2: 2,
        W: 1,
        H: 2,
        M_1: 0,
        M_2: 0,
        V: 0,
        cut: 1  // probably fraction
    },
    vis: inp => {


        const h = inp.H/2
        const b = inp.W
        const dx = inp.x_2-inp.x_1
        const cutLoc = (inp.cut-0.5)*2*h
        const leftMoment = inp.M_1
        const rightMoment = inp.M_2
        const shear = inp.V

        const x_center = (inp.x_1+inp.x_2)/2
        //#region <define initial values>
        var space=1/3
        
       
        
        var A=2*h*b
        var I=1/12*b*(2*h)**3
        
        
        var isRound=false
        var bottomOpacity=1
        var topOpacity=0.3
        var scale=30        // scales the arrow length down by this value
        //#endregion
        
        
        //#region <create boxes>
        var boxBottom=box({opacity: bottomOpacity})
        var boxTop=box({opacity: topOpacity})
        var boxes=[boxBottom,boxTop]
        // var beamBox=box({size: vec(100,2*h+.01,b+.01)})
        //#endregion
        
        //#region <create arrows>
        var LNA=[]
        var RNA=[]
        var LVA=[]
        var RVA=[]
        var TVA=[]
        for (let z=-b/2; z<=b/2;z+=space){
            for (let y=-h;y<=h;y+=space){
                LNA.push(arrow({pos: vec(inp.x_1,y,z),round: isRound,color: vec(0,0,1)}))
                RNA.push(arrow({pos: vec(inp.x_2,y,z),round: isRound,color: vec(0,0,1)}))
        
                LVA.push(arrow({pos: vec(inp.x_1,y,z),round: isRound,color: vec(1,0,0)}))
                RVA.push(arrow({pos: vec(inp.x_2,y,z),round: isRound,color: vec(1,0,0)}))
            }
            for (let x=inp.x_1;x<=inp.x_2;x+=space){
                TVA.push(arrow({pos: vec(x,0,z),round: isRound,color: vec(1,0,0)}))
            }
        }
        
        
        
        
        
        var Q=(cutLoc**2-h**2)*b/2
        var dH=Q*(rightMoment-leftMoment)/I
        
        function tau(V,y){return -3/2*V/A*(1-y**2/h**2)}
        function sigma(M,y){return M*y/I}
        //#endregion
        
        //#region <shear and moment relation>
        for (let i=0;i<LNA.length;i++){ 
            LNA[i].axis=vec(sigma(leftMoment,LNA[i].pos.y),0,0).divide(scale)
            RNA[i].axis=vec(sigma(rightMoment,RNA[i].pos.y),0,0).divide(-scale)
            LVA[i].axis=vec(0,tau(shear,LVA[i].pos.y),0).divide(-scale)
            RVA[i].axis=vec(0,tau(shear,RVA[i].pos.y),0).divide(scale)
        }
        //#endregion
        
        //#region <cut location>
        // change box dimension:
        boxBottom.size=vec(dx,h+cutLoc,b)
        boxTop.size=vec(dx,h-cutLoc,b)
        boxBottom.pos=vec(x_center,-(h-cutLoc)/2,0)
        boxTop.pos=vec(x_center,(h+cutLoc)/2,0)
        
        // change visibility of arrows above and below:
        var sideArrows=[LNA,RNA,LVA,RVA]
        
        for (let i=0;i<sideArrows.length;i++){
            var arrowGroup=sideArrows[i] 
            for (let j=0;j<arrowGroup.length;j++){  
                var arrowSel=arrowGroup[j]  
                if (arrowSel.pos.y>cutLoc){arrowSel.visible=false}
                else{arrowSel.visible=true}
            }
        }
        
        // change top shear value:
        for (let i=0;i<TVA.length;i++){
            var arrowSel=TVA[i]
            arrowSel.pos.y=cutLoc
            arrowSel.axis=vec(tau(shear,cutLoc),0,0).divide(scale)
        }
        //#endregion

    }    
}    


vis_blocks.push(draw_beam)
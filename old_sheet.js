import React, { useState } from "react";
import { addStyles, EditableMathField, StaticMathField } from "react-mathquill";
import nerdamer from 'nerdamer/nerdamer.core.js'
import 'nerdamer/Algebra.js'
import 'nerdamer/Calculus.js'
import 'nerdamer/Solve.js'

addStyles();

function splitSolveFor(text){
  try{
    var splitEnd=text.split(")")
    var main=splitEnd[0]

    var splitMain=main.split("(")

    var solveFor=splitMain[0]
    var inTermsOfText=splitMain[1]

    
    var inTermsOf=inTermsOfText.split(",")
    return [solveFor,inTermsOf]
  }catch{
    return [text.split("(")[0],[]]
  }
}


function solveEqns(eqnsIn,solveFor,inTermsOf){

  
  /* additional stuff:
  parse equations (check for one equality, operations, and variables and that's it)
  check if no contradiction in equations
  check if infinite solutions (a==a shouldn't return 0)
  check if solveVars are in equations
  if solveFor is empty, just use solveEquations
  deal with multiple solutions when substituting (like quadratics)


  systems(["x=4*a+b","b=2*a"],"b",["a","x"]) returns "b=-4*a+x" (ignores the next equation)
  instead it should keep on going and throw error if there's ever too few variables
  */


  
  if (solveFor.length===0){
    if (eqnsIn.length===1){eqnsIn=eqnsIn[0]} // if single equation, nerdamer requires string, not array

    try {
      var sol=nerdamer.solveEquations(eqnsIn).toString() // need to have it access all equations instead!
      if (sol===""){
        return "Blank Line (or it cant solve)"
      }
    } catch {
      return "Cannot Solve"
    }
    

    

    // variable name is not included in array if there's only one variable ):
    if (!sol.includes(",")){
      sol=nerdamer(eqnsIn).variables()[0].concat(",").concat(sol)
    }
   
    var splitSol=sol.split(",")
    var eqnSol=[]
    for (let i=0;i<splitSol.length/2;i++){
      eqnSol.push(
        splitSol[2*i]
        .concat("=")
        .concat(splitSol[2*i+1])
      )


    }
    return eqnSol
  }

 
  
  var eqns=[[]]
  for (let i=0;i<eqnsIn.length;i++){
      eqns[0][i]=nerdamer(eqnsIn[i])
  }

  //var solveFor="a" // for now you must specify what to solve in terms of
  //var inTermsOf=["b"]
  var solveVars=[solveFor,inTermsOf].flat()


  // function will return the single equation which will then be solved for
  var nEqns=eqns[0].length


  for (var i=0;i<nEqns-1;i++){
    var eqn=eqns[i][i]
    //var eqn=nerdamer('simplify('.concat(eqns[i][i]).concat(')'))
    
    var eqnVars=eqn.variables()

    

    var solution


    var subVar=excess(eqnVars,solveVars)
    if (subVar===undefined){
        // this means there's no additional variables in the equation
        if (excess(solveVars,eqnVars)===undefined){
          // solveVars and eqnVars are equivalent
          solution=eqn
          break
        }else{
          return 'error: too many variables to solve in terms of'
        }

    }


    
    var solvedEqn=eqn.solveFor(subVar)

    eqns[i+1]=[]
    for (var j=0;j<nEqns-i-1;j++){
      eqns[i+1][i+1+j]=eqns[i][i+1+j].sub(subVar,solvedEqn)
    } 
  
  }

  if (solution===undefined){  // solution hasn't already been found OR only one eqn
    var finalEqn=eqns[nEqns-1][nEqns-1]
    var solutionVars=finalEqn.variables()
    if (excess(solveVars,solutionVars)!==undefined){
      return 'error: end too many variables to solve in terms of'
    }else if (excess(solutionVars,solveVars)!==undefined){
      return 'error: end too few variables to solve in terms of'
    }else{
      solution=finalEqn
    }
  }

  
// only returns the first item which is excess
  function excess(A,B){
      // if it's one variable, nerdamer doesn't use an array, so this puts it in an array:
      if (typeof(A)==="string"){A=[A]}
      if (typeof(B)==="string"){B=[B]}
  
      return A.find(
          itemTestExtra=>B.every(
          (itemCompare)=>{return itemTestExtra!==itemCompare}
          )
      )
  }

  
  return solveFor.concat("=").concat(solution.solveFor(solveFor).toString())
}



function computeSheet(sheetData){

  // do a check for duplicate names

  // for now system names must be in order ):

  var newSheetData=sheetData

  // clear all of the previous results:
  for (let i=0;i<sheetData.length;i++){
    var system=sheetData[i]
    for (let j=0;j<system.eqns.length;j++){
      newSheetData[i].eqns[j].result=""  
    }
  }
  
  var hitError=false
  var usedNames=[]
  for (let i=0;i<sheetData.length;i++){
    var SoE=sheetData[i]
    var eqns=SoE.eqns
    for (let j=0;j<eqns.length;j++){
      try {
        var eqn=nerdamer.convertFromLaTeX(eqns[j].eqn).toString()
      } catch  {
        var eqn="NOPE"
      }
      
      var result

      if(eqn===""){
        continue
      }

      var solveForLaTeX
      var inTermsOfLaTeX
      var inTermsOf=[]
      var solveFor
      if (eqns[j].solveText===null){var solveText=""}
      else {var solveText=eqns[j].solveText}

      
      [solveForLaTeX,inTermsOfLaTeX]=splitSolveFor(solveText)
      
      
      try{
        var solveFor=nerdamer.convertFromLaTeX(solveForLaTeX).toString()
      }catch{
        var solveFor=""
      }

      
      for (let j=0;j<inTermsOfLaTeX.length;j++){

       try{
          inTermsOf.push(nerdamer.convertFromLaTeX(inTermsOfLaTeX[j]).toString())
        }catch{
          inTermsOf.push("")
        }
        
      }


      //[solveFor,inTermsOf]=splitSolveFor(solveText)

      // check if reference:
      if (!eqn.includes("=")){
        // check if a name on sheet:
        if (!usedNames.includes(eqn)){
            result=("TEXTerror: ").concat(eqn).concat(" has not been defined")
            hitError=true
        }else if (usedNames.includes(eqn)){

          var names=[]
          for (let i=0;i<sheetData.length;i++){names.push(sheetData[i].name)}
          var iRef=names.findIndex((name)=>name===eqn)

          var system=[]
          for (let i=0;i<sheetData[iRef].eqns.length;i++){system.push(sheetData[iRef].eqns[i].result)}
          if (eqns[j].operation==="solve"){
            result=solveEqns(system,solveFor,inTermsOf)
          }else{
            result=system
          }
        }
      }else if(eqns[j].operation==="solve"){
        result=solveEqns([eqn],solveFor,inTermsOf)
      }else{
        result=eqn
      }
      newSheetData[i].eqns[j].result=result
      if (hitError){
        return newSheetData
      }
      usedNames.push(SoE.name)
    }
  }

  return newSheetData
}


class Sheet extends React.Component {
  // constructor has states with sheet info?
  constructor(props){
    super(props)

    this.state= {
        SoEs:[
         {
             name:"s",
             
             eqns: [
              {eqn: "\\rho_d=\\frac{m_s}{V}", operation: "", solveText: null, result: ""},
              {eqn: "\\rho=\\frac{m}{V}", operation: "", solveText: null, result: ""},
              {eqn: "m=m_w+m_s", operation: "", solveText: null, result: ""},
              {eqn: "\\omega=\\frac{m_w}{m_s}", operation: "", solveText: null, result:""}
             ]
         },
         {
             name:"SoE 2",
             eqns: [
              {eqn: "s", operation: "solve", solveText: "\\rho_d\\left(\\rho,\\omega\\right)", result:""}
                 
             ]
         }
     ]
    }
  }


  render(){
     var sheetElements=[]
     for (let i=0;i<this.state.SoEs.length;i++){
         var SoE=this.state.SoEs[i]
         //this.SoEs[i].name=newName

         sheetElements.push(<Name 
         
             onEdit={(newName)=>
                 {
                    // should just appl
                    this.state.SoEs[i].name=newName


                    this.setState({SoEs: computeSheet(this.state.SoEs)})
                    
                 }
             } 
             text={SoE}
         />)

        

         for (let j=0;j<SoE.eqns.length;j++){
            sheetElements.push(<Line 
              onEdit={
                (newEqn)=>
                {this.state.SoEs[i].eqns[j]=newEqn
                  this.setState({SoEs: computeSheet(this.state.SoEs)})
                }
              }
              addLine={()=>
                {
                  var blankLine={eqn:"",operation:"",solveText: null,result:""}
                  this.state.SoEs[i].eqns.splice(j+1, 0, blankLine)

                  this.setState({SoEs: this.state.SoEs})
                }
              }
              removeLine={()=>
                {
                  var blankLine={eqn:"",result:""}
                  this.state.SoEs[i].eqns.splice(j, 1)

                  this.setState({SoEs: this.state.SoEs})
                }
              }
              
              
              
               
              eqnData={SoE.eqns[j]}             
            />)
         }
     }
     //console.log(this.state.SoEs)
     return(
      sheetElements
     )
 
  }
}


class Name extends React.Component {
 render(){
     //const name=<tr><td></td></tr>
     const editField=<input 
         type="text" 
         value={this.props.text.name} 
         onChange={(e)=>{this.props.onEdit(e.target.value)
         }
         
     }
     >
     </input>

     return <tr><td>{editField}</td></tr>
 } 
}

class Line extends React.Component {
  constructor(props){
    super(props)
    
  }

  breakUp(newText){
    var newEqnData=this.props.eqnData
    newEqnData.eqn=newText
    if(newText.includes("solve")){
      newEqnData.operation="solve"
      newEqnData.eqn=newText.replace("solve","")  
    }
    if(newText.includes("for")){
      newEqnData.eqn=newText.replace("for","")
      newEqnData.solveText=""
    }


    return newEqnData
  }

  render() {


    var eqnData=this.props.eqnData

     if (eqnData.result.includes("TEXT")){
       var resultDisplay="\\text{".concat(eqnData.result.replace("TEXT","")).concat("}")
     }else{

       if (typeof eqnData.result==="string"){
         eqnData.result=[eqnData.result]
       }
       var resultDisplay=[]

       for (let i=0;i<eqnData.result.length;i++){
         
         resultDisplay.push(
          <StaticMathField>
            {nerdamer.convertToLaTeX(eqnData.result[i])}
          </StaticMathField>,
         )
         resultDisplay.push(<br/>)
       }

     }


    var inputField=[]
    

    var eqnField=<EditableMathField
      latex={this.props.eqnData.eqn}
      onChange={(newField)=>{this.props.onEdit(this.breakUp(newField.latex()))}}
    />

    var solveForField=<EditableMathField
      latex={this.props.eqnData.solveText}
      onChange={(newField)=>{
        var newEqnData=this.props.eqnData
        newEqnData.solveText=newField.latex()
        this.props.onEdit(newEqnData)
      }}
    />




    if (this.props.eqnData.operation==="solve"){
      inputField.push(<StaticMathField>{"\\text{solve }"}</StaticMathField>)
    }
    inputField.push(eqnField)
    if (!(this.props.eqnData.solveText===null)){
      inputField.push(<StaticMathField>{"\\text{for }"}</StaticMathField>)
      inputField.push(solveForField)
    }
    




     const line=<tr> 
        <td>
           <button onClick={
              ()=>{this.props.addLine()}
             }>+</button>
             <button onClick={
               ()=>{this.props.removeLine()}
             }>-</button>
         </td>
         <td>
         {inputField}
         </td>
         <td>
            {resultDisplay}
         </td>
         
     </tr>


      return line
 }
}

export default Sheet


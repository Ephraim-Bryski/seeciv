function makeTabBar(parent){
    //! add style (maybe make other CSS file), change look when clicked, add logo
    
    var tabTitles=["Topics","About","Code","Feedback"]
    var tabLinks=["","about.html","about_code.html","feedback.html"]
    

    for (let i=0; i<tabTitles.length; i++) {
        var tab=document.createElement("a")
        tab.href=tabLinks[i]
        if (i==0){
            tab.href="https://www.seeciv.com"
        }
        tab.innerHTML=tabTitles[i]
        tab.classList="tab"
        parent.append(tab)
    }

    var logo=document.createElement("img")
    logo.src="logo.png"

    Object.assign(logo.style,{
        position: "absolute",
        right: "2%",
        top: "2%",
        height: "10%"
    })

    
    parent.append(logo)


    var tabs=document.getElementsByClassName("tab")

    var pageURL=(window.location.href).split("/")[3] //first 3 are due to http://
    var selTab=tabs[tabLinks.indexOf(pageURL)]

    for (let i = 0; i < tabTitles.length; i++) { 
        tabs[i].classList.remove("active")

    }

    selTab.classList.add("active")
}
    
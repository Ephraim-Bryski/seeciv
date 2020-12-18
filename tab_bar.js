function makeTabBar(parent){
    //! add style (maybe make other CSS file), change look when clicked, add logo
    
    var tabTitles=["Topics","About","Feedback"]
    var tabLinks=["index.html","about.html","feedback.html"]
    

    for (let i=0; i<3; i++) {
        var tab=document.createElement("a")
        tab.href=tabLinks[i]
        tab.innerHTML=tabTitles[i]
        tab.classList="tab"
        parent.append(tab)
    }


    var tabs=document.getElementsByClassName("tab")

    var pageURL=(window.location.href).split("/")[3] //first 3 are due to http://
    var selTab=tabs[tabLinks.indexOf(pageURL)]

    for (let i = 0; i < tabTitles.length; i++) { 
        tabs[i].classList.remove("active")

    }

    selTab.classList.add("active")
}
    
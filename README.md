# seeciv
This is the code for the website seeciv.com. The sight will explore topics in Civil Engineering with the aid of interactive 3D graphics.

The content will based off of the MATLAB apps I created: https://www.mathworks.com/matlabcentral/fileexchange/79673-apps-for-solid-mechanics.

The site uses GlowScript for 3D graphics and MathJax for equations. Find more at glowscript.org.

Any feedback would be greatly appreciated!

The structure of the code is the following:

  Index.html has links to HTML files for each topic (names.html and make_shapes.html). The topic files define a function (getInfo and makeShapes) that creates the text, graphics, and widgets for that topic. 

  The topic files call make_page.js which creates the general display for the topic (position of divs and buttons for moving through stages of graphics). It calls the functions   (getInfo and makeShapes) to populate the page with the topic's content.

  change_under_text.js changes the values of the under braces using DOM manipulation of the MathJax object.

  widget.group.js groups an HTML slider, spinner, and text label.

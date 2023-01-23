
import re

cdn_tags = """<link type="text/css" href="https://www.glowscript.org/css/redmond/2.1/jquery-ui.custom.css" rel="stylesheet" />
<link type="text/css" href="https://www.glowscript.org/css/ide.css" rel="stylesheet" />
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/MathJax.js?config=TeX-MML-AM_CHTML"></script>
<script src="https://cdn.jsdelivr.net/gh/nicolaspanel/numjs@0.15.1/dist/numjs.min.js"></script>




<script type="text/javascript" src="https://www.glowscript.org/lib/jquery/2.1/jquery.min.js"></script>
<script type="text/javascript" src="https://www.glowscript.org/lib/jquery/2.1/jquery-ui.custom.min.js"></script>
<script type="text/javascript" src="https://www.glowscript.org/package/glow.3.0.min.js"></script>
<script type="text/javascript" src="https://www.glowscript.org/package/RSrun.3.0.min.js"></script>


<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/10.6.4/math.js"></script>
<script src="https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js"></script>  


<!-- not needed since its imported in worker, only including it so i can use it in the debugger-->



<!-- firebase-->
<script src="https://www.gstatic.com/firebasejs/3.5.2/firebase.js"></script>

<!-- mathquill -->
<link rel="stylesheet" href="mathquill/mathquill.css"/>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script src="mathquill/mathquill.js"></script>


<!-- nerdamer just used to convert from latex -->
<script src="nerdamer/all.min.js"></script>"""


matches = re.findall('src="(.*)"',cdn_tags)

skip_file_list = ""

for match in matches:
    skip_file_list+='"'+match+'",\n'

print(skip_file_list)
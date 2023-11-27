"""
so basically....

firebase just deletes empty arrays and dictionaries
which is soooooooooooo annoying

so instead im just going to have it save a string and then i'll parse it

"""


import json

with open("fuck_firebase.json") as f:
    json_old = json.loads(f.read())

textified = json.dumps(json_old).replace('"',"'")

fake_json = f'"{textified}"'

with open("r_u_happy_fb.json","w") as f:
    f.write(fake_json)

pass
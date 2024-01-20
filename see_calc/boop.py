import json

with open("google_credentials.json") as f:
    cred = json.loads(f.read())


print(cred["web"]["client_id"])
pass
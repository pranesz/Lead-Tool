# import requests

# url = "https://api.leadmagic.io/email-validate?email=nellena.adekoya@atriumhealth.org"
# headers = {"X-API-Key": "3d3407724b3a7e8fc163fec4e793b9da"}

# response = requests.get(url, headers=headers)
# print("Status:", response.status_code)
# print("Raw response:", response.text)


import requests

url = "https://api.leadmagic.io/email-validate"

headers = {
    "X-API-Key": "3d3407724b3a7e8fc163fec4e793b9da",
    "Content-Type": "application/json",
    "Accept": "application/json"
}

data = {
    "email": "nellena.adekoya@atriumhealth.org"
}

response = requests.post(url, headers=headers, json=data)

print("Status:", response.status_code)
print("Response:", response.text)
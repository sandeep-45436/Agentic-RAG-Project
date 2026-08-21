import json, requests
url = 'http://localhost:8000/api/plan'
payload = {
    "messages": [{"role": "user", "content": "Generate a plan to list all agents"}],
    "organizationId": "org123"
}
resp = requests.post(url, json=payload)
print('Status:', resp.status_code)
print('Response:', resp.text)

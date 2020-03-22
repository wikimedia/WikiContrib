import asyncio
from aiohttp import ClientSession
import json
from fuzzywuzzy import fuzz
from pandas import read_csv
from datetime import datetime

API_TOKEN = 'api-mic3eboa477foxpg5mcjcfnff5yw'

# phab_response = requests.post(phab_url,data = phab_data)

# phab_fullname = phab_response.json()['result']['data'][0]['fields']['realName']


# gerrit_response = requests.get(gerrit_url)

# gerrit_fullname = json.loads(gerrit_response.content[4:].decode("latin-1"))[0]['name']


def fuzzyMatching(string1,string2):
    return fuzz.WRatio(string1,string2)

async def get_gerrit_data(session,gerrit_fullname,gerrit_url):
    async with session.get(gerrit_url) as response:
        data = await response.read()
        try:
            data = json.loads(data[4:].decode("latin-1"))[0]['name']
        except json.JSONDecodeError:
            data = ''
        if(data == ''):
            gerrit_fullname = []
        else:
            gerrit_fullname.append(data)


async def get_phab_data(session,phab_fullname,phab):
    async with session.post(phab["phab_url"],data=phab['phab_data']) as response:
        data  = await response.read()
        data = json.loads(data.decode('latin-1'))['result']['data'][0]['fields']['realName']
        phab_fullname.append(data)


async def make_concurrent_requests(phab_fullname,gerrit_fullname,phab,gerrit_url):
    tasks = []
    async with ClientSession() as session:
        tasks.append(get_gerrit_data(session=session,gerrit_fullname=gerrit_fullname,
            gerrit_url=gerrit_url))
        tasks.append(get_phab_data(session=session,phab_fullname=phab_fullname,phab=phab))
        await asyncio.gather(*tasks)



async def get_fullnames(result,gerrit_username,phab_username):
    print("get_fullnames started----------------------")
    phab = {'phab_data':{
            'constraints[usernames][0]':phab_username,
            'api.token': API_TOKEN,
            },
            'phab_url':'https://phabricator.wikimedia.org/api/user.search',
            }

    gerrit_url = 'https://gerrit.wikimedia.org/r/accounts/?q=name:'+gerrit_username+'&o=DETAILS'

    phab_fullname = []
    gerrit_fullname = []
    s = datetime.now()
    await make_concurrent_requests(phab_fullname=phab_fullname,gerrit_fullname=gerrit_fullname,
    phab=phab,gerrit_url=gerrit_url)
    print(phab_fullname,gerrit_fullname)
    match = fuzzyMatching(phab_fullname[0],gerrit_fullname[0])
    s = (datetime.now() - s).total_seconds()
    print("get_fullnames ended---------took "+str(s)+" seconds")
    result.append({
        'gerrit_fullname':gerrit_fullname[0],
        'phab_fullname':phab_fullname[0],
        'fuzzy_match':match
        })



async def get_fullnames_concurrently(names,result):
    tasks = []
    for row in names.itertuples():
        tasks.append(get_fullnames(result=result,gerrit_username=row.Gerrit,phab_username=row.Phabricator))
    await asyncio.gather(*tasks)


def main():
    result = []
    names  = read_csv("wiki_contributors.csv",encoding="latin-1")
    asyncio.run(get_fullnames_concurrently(names=names,result=result))
    if(len(result) > 0):
        json_object = json.dumps(result,indent=4)
        with open('fuzzy_match-'+str(int(datetime.now().timestamp()))+'.json','w') as outfile:
            outfile.write(json_object)
        for user in result:
            print('gerrit_fullname = ',user['gerrit_fullname'])
            print('phab_fullname = ',user['phab_fullname'])
            print('fuzzy match = ',user['fuzzy_match'])
main()

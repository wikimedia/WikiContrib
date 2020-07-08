from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
import asyncio
from json import loads, dumps, JSONDecodeError
from aiohttp import ClientSession
import time
from math import ceil
from copy import deepcopy
from query.models import Query
from django.shortcuts import get_object_or_404
from pandas import read_csv, isnull
from datetime import datetime, timedelta
from pytz import utc
from .models import ListCommit
from .serializers import UserCommitSerializer
from WikiContrib.settings import GITHUB_FALLBACK_TO_PR, GITHUB_API_LIMIT
from .helper import get_prev_user, get_next_user, ORGS, API_ENDPOINTS, REQUEST_DATA
import sys
from rapidfuzz import fuzz
if GITHUB_FALLBACK_TO_PR:
    from .github_fallback import get_github_pr_by_org

version = sys.hexversion
version_3_3 = 50530288
username_does_not_exist = "OOPS! We couldn't find an account with that username."
no_username_provided = "OOPS! We couldn't find a username in your request."

def choose_time_format_method(expression, format):
    """
    :Summary: strftime("%s") is not a valid string formatting method in python,
    therefore it works on linux servers but not windows. To handle this, this function
    checks for python version and decides what conversion method to use.
    the "format" parameter makes sure that that the correct required type is always returned
    """

    # if we are running python3.3 or greater
    if(version >= version_3_3):
        # if the datetime object is offset aware
        if(expression.tzinfo != None):
            if(format == "str"):
                return str(int(expression.timestamp()))
            else:
                return int(expression.timestamp())
        # else if the datetime object is offset naive
        else:
            if(format == "str"):
                return str(int((expression - datetime(1970, 1, 1)).total_seconds()))
            else:
                return int((expression - datetime(1970, 1, 1)).total_seconds())
    # else if we are running python version lower than python3.3 i.e most linux servers
    else:
        if(format == "str"):
            return expression.strftime("%s")
        else:
            return int(expression.strftime("%s"))


def fuzzyMatching(control, full_names):
    """
    :Summary: compare the full names in the full_names dictionary to the control
              full name, gather parcentage similarity in an array and return the
              average.
    :control: A control full name string against which other full names in
              full_names dict are compared.
    :full_names: A Dictionary containing a users full names as specified in the
              neccessary platforms
    :return: returns average parcentage similarity or zero if any of the
             usernames doesn't exist or was not provided.
    """
    _list = []
    ave = 0
    for key in full_names:
        if full_names[key] != username_does_not_exist:
            if full_names[key] != no_username_provided:
                _list.append(fuzz.WRatio(control, full_names[key],score_cutoff=60))
        else:
            return 0

    for each in _list:
        ave += each

    return ave/len(_list)


async def get_full_name(data):
    """
    :Summary: Gets users full name per platform and add them to the full_names
              dictionary.
    """
    if data["platform"] == "phab":
        if data["full_names"]["phab_full_name"] == "":
            if data["request_data"]['constraints[usernames][0]'] != "":
                async with data["session"].post(data["url"],
                data=data["request_data"]) as response:
                    realname  = await response.read()
                    _data = loads(realname.decode("utf-8"))['result']['data']
                    if(len(_data) != 0):
                        realname = _data[0]['fields']['realName']
                        data["full_names"]["phab_full_name"] = realname
                    else:
                        data["full_names"]["phab_full_name"] = username_does_not_exist
            else:
                data["full_names"]["phab_full_name"] = no_username_provided

    if data["platform"] == "gerrit":
        if data["url"].split("?")[1].split("&")[0].split(":")[1] != "":
            async with data["session"].get(data["url"]) as response:
                realname = await response.read()
                try:
                    data["full_names"]["gerrit_full_name"] = loads(realname[4:].decode("utf-8"))[0]["name"]
                except:
                    data["full_names"]["gerrit_full_name"] = "username does not exist"
        else:
            data["full_names"]["gerrit_full_name"] = "no username provided"

    if data["platform"] == "github":
        if data["request_data"]["github_username"] != "":
            headers = {"Authorization":"bearer "+data["request_data"]["github_access_token"]}
            query = """{{user(login:"{username}"){{name}}}}""".format(
            username=data["request_data"]["github_username"])
            async with data["session"].post("https://api.github.com/graphql",
             headers=headers, data=dumps({"query":query})) as response:
                full_name = await response.read()
                full_name = loads(full_name.decode('utf-8'))
                try:
                    full_name = full_name['data']['user']['name']
                    data["full_names"]["github_full_name"] = full_name
                except:
                    data["full_names"]["github_full_name"] = username_does_not_exist
        else:
            data["full_names"]["github_full_name"] = no_username_provided


class MatchFullNames(APIView):

    http_method_names = ['post']

    def post(self, request, *args, **kwargs):

        async def concurrent_get_fullnames(urls, request_data, loop, full_names):
            tasks = []
            async with ClientSession() as session:
                tasks.append(loop.create_task((get_full_name(data={"platform":"phab", "session":session,
                 "full_names":full_names, "url":urls[0], "request_data":request_data[0]}))))
                tasks.append(loop.create_task((get_full_name(data={"platform":"gerrit", "session":session,
                 "full_names":full_names, "url":urls[1]}))))
                tasks.append(loop.create_task((get_full_name(data={"platform":"github", "session":session,
                 "full_names":full_names, "request_data":request_data[1]}))))

                await asyncio.gather(*tasks)

        user = request.data['users'][0].copy()
        fullname = user['fullname']
        phabricator_username = user['phabricator_username']
        gerrit_username = user['gerrit_username']
        github_username = user['github_username']

        if isinstance(phabricator_username, float):
            phabricator_username = ''

        if isinstance(gerrit_username, float):
            gerrit_username = ''

        if isinstance(github_username, float):
            github_username = ''

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        full_names = {"phab_full_name":"","gerrit_full_name":"","github_full_name":""}

        request_data = []
        urls = []
        request_data.append(deepcopy(REQUEST_DATA[2]))
        request_data.append(deepcopy(REQUEST_DATA[3]))

        urls.append(API_ENDPOINTS[0][1])
        urls.append(API_ENDPOINTS[1][1].format(gerrit_username=gerrit_username))

        request_data[0]['constraints[usernames][0]'] = phabricator_username

        request_data[1]['github_username'] = github_username

        loop.run_until_complete(concurrent_get_fullnames(urls=urls, request_data=request_data,
                                         loop=loop,full_names=full_names))

        match_percent = fuzzyMatching(control=fullname, full_names=full_names)

        return Response({
            'match_percent':match_percent
        })


async def get_task_authors(url, request_data, session, resp, phid, full_names):
    """
    :Summary: Get the Phabricator tasks that the user authored.
    :param url: URL to be fetched.
    :param request_data: Phabricator token and JSON Request Payload.
    :param session: ClientSession to perform the API request.
    :param resp: Global response array to which the response from the API has to
                 be appended.
    :param phid: Phabricator ID of the user
    :return: None
    """
    if request_data[0]['constraints[authorPHIDs][0]'] != '':
        page, after = True, False
        while page or after is not False:
            page = False
            after = False
            async with session.post(url[0], data=request_data[0]) as response:
                data = await response.read()
                data = loads(data.decode('utf-8'))['result']
                resp.extend(data['data'])
                if phid[0] is False:
                    if len(data['data']) > 0:
                        phid[0] = data['data'][0]['fields']['authorPHID']
                    else:
                        phid[0] = True
                if data['cursor']['after']:
                    after = data['cursor']['after']
                    request_data[0]['after'] = after

    await get_full_name(data={"platform":"phab", "session":session,
     "full_names":full_names, "url":url[1], "request_data":request_data[2]})

async def get_task_assigner(url, request_data, session, resp, full_names):
    """
    :Summary: Get the Phabricator tasks that the user assigned with.
    :param url: URL to be fetched.
    :param request_data: Phabricator token and JSON Request Payload.
    :param session: ClientSession to perform the API request
    :param resp: Global response array to which the response from the API has to
                 be appended.
    :return: None
    """
    if request_data[1]['constraints[assigned][0]'] != '':
        page, after = True, False
        while page or after is not False:
            page = False
            after = False
            async with session.post(url[0], data=request_data[1]) as response:
                data = await response.read()
                data = loads(data.decode('utf-8'))['result']
                resp.extend(data['data'])
                if data['cursor']['after']:
                    after = data['cursor']['after']
                    request_data[1]['after'] = after

    await get_full_name(data={"platform":"phab", "session":session,
     "full_names":full_names, "url":url[1], "request_data":request_data[2]})


async def get_gerrit_data(url, session, gerrit_resp,full_names):
    """
    :Summary: Get all the Gerrit tasks of the user.
    :param url: URL to be fetched.
    :param session: ClientSession to perform the API request.
    :param gerrit_resp: Global response array to which the response from the API
                        has to be appended.
    :return: None
    """
    data = []
    if url[0].split("?")[1].split("&")[0].split(":")[1] != "":
        async with session.get(url[0]) as response:
            data = await response.read()
            try:
                data = loads(data[4:].decode("utf-8"))
            except JSONDecodeError:
                data = []

            gerrit_resp.extend(data)

    await get_full_name(data={"platform":"gerrit", "full_names":full_names,
     "session":session,"url":url[1], "gerrit_response":data})


async def get_github_commit_by_org(orgs, url, request_data, session, github_resp,
 rateLimitCount):
    """
    :Summary: make concurrent requests to get the users commits to wikimedia
              accounts on github two at a time.
    :param url: URL to be fetched.
    :param session: ClientSession to perform the API request.
    :param request_data: data that is expected to be in the request but not in
                         the url string link headers
    :param github_resp: Global response array to which the response from the API
                        has to be appended.
    :return: None
    """

    createdStart = datetime.fromtimestamp(request_data["createdStart"])
    createdEnd = datetime.fromtimestamp(request_data["createdEnd"])

    dateRangeStart = createdStart
    dateRangeEnd = createdEnd

    """
    <-----------------------------------------------------------
    If time range between createdStart and createdEnd is greater than 6 months,
    divide it into two and fetch each half seperately
     """
    if(dateRangeEnd - dateRangeStart) > timedelta(183):
        dateRangeEnd = createdStart + timedelta(183)

    loopCount = ceil((createdEnd - createdStart)/timedelta(183))
    """-----------------------------------------------------/>"""


    headers = {"Authorization":"token "+request_data["github_access_token"],
               "Accept":"application/vnd.github.cloak-preview"}

    orgs_filter = """user:{org_0}+user:{org_1}""".format(org_0=orgs[0], org_1=orgs[1])
    query = """{url}+{orgs_filter}+committer-date:{dateRangeStartIsoFormat}..{dateRangeEndIsoFormat}"""


    def getNextUrlOrNone(response):
        url = None
        link = response.headers.get("Link")
        try:
            for page in link.split(","):
                if(page.endswith('rel="next"')):
                    url = page.split(";")[0].split(">")[0].split("<")[1]
                    break
        except:
            pass
        return url

    while loopCount > 0:
        newURL = query.format(url=url, orgs_filter=orgs_filter,
                 dateRangeStartIsoFormat=dateRangeStart.isoformat()+"Z",
                 dateRangeEndIsoFormat=dateRangeEnd.isoformat()+"Z")
        while newURL:
            if rateLimitCount[0] == GITHUB_API_LIMIT:
                break
            async with session.get(newURL, headers=headers) as response:
                data = await response.read()
                try:
                    data = loads(data.decode("utf-8"))["items"]
                    github_resp.extend(data)
                    newURL = getNextUrlOrNone(response)
                    rateLimitCount[0] += 1
                except:
                    github_resp.extend([{"rate-limit-message":"OOPS! Github's API rate limit \
                    seems to have exceeded. You could try again in a couple of minutes."}])
                    newURL = None
                    loopCount = 0
        dateRangeStart = dateRangeStart + timedelta(184)
        dateRangeEnd = createdEnd
        loopCount -= 1



async def get_github_data(url, request_data, session, github_resp, full_names):
    """
    :Summary: make concurrent requests to get the users contributions to wikimedia
              accounts on github two at a time.
    :param url: URL to be fetched.
    :param session: ClientSession to perform the API request.
    :param request_data: data that is expected to be in the request but not in
                         the url string link headers
    :param github_resp: Global response array to which the response from the API
                        has to be appended.
    :return: None
    """
    tasks = []
    index = 0
    rateLimitCount = [0]

    await get_full_name(data={"platform":"github", "session":session,
     "full_names":full_names, "request_data":request_data})

    if(full_names["github_full_name"] != username_does_not_exist and
      full_names["github_full_name"] != no_username_provided):
        while index < (len(ORGS)):# iterate through two items in the orgs list at once
            if GITHUB_FALLBACK_TO_PR == False:
                tasks.append(get_github_commit_by_org([ORGS[index], ORGS[index+1]],
                 url[0], request_data, session, github_resp, rateLimitCount))
            else:
                tasks.append(get_github_pr_by_org([ORGS[index], ORGS[index+1]],
                 url[1], request_data, session, github_resp))
            index = index + 2
        await asyncio.gather(*tasks)


def format_data(pd, gd,  ghd, ghd_rate_limit_message, query, phid):
    """
    :Summary: Format the data fetched, store the data to Databases and remove the
              irrelevant data.
    :param pd: Phabricator Data.
    :param gd: Gerrit Data
    :param ghd: Github Data
    :param query: Query Modal Object
    :param phid: Phabricator ID of the user.
    :return: JSON response of all the tasks in which the user involved,
            in the specified time span.
    """

    resp = []
    ghdRateLimitTriggered = False
    len_pd = len(pd)
    len_gd = len(gd)
    len_ghd = len(ghd)

    if len_pd > len_gd and len_pd > len_ghd:
        leng = len_pd
    elif len_gd > len_pd and len_gd > len_ghd:
        leng = len_gd
    else:
        leng = len_ghd

    temp = []
    if query.queryfilter.status is not None and query.queryfilter.status != "":
        status_name = query.queryfilter.status.split(",")
    else:
        status_name = True
    with transaction.atomic():
        ListCommit.objects.filter(query=query).delete()
        for i in range(0, leng):
            if i < len_pd:
                if pd[i]['phid'] not in temp:
                    temp.append(pd[i]['phid'])
                    date_time = utc.localize(datetime.fromtimestamp(int(pd[i]['fields']['dateCreated']))
                                             .replace(hour=0, minute=0, second=0, microsecond=0))
                    status = pd[i]['fields']['status']['name'].lower()
                    if (status_name is True or status in status_name
                    or (status == "open" and "p-open" in status_name)):
                        rv = {
                            "time": date_time.isoformat(),
                            "phabricator": True,
                            "status": pd[i]['fields']['status']['name'],
                            "owned": pd[i]['fields']['authorPHID'] == phid,
                            "assigned": pd[i]['fields']['ownerPHID'] == True
                            or phid == pd[i]['fields']['ownerPHID']
                        }
                        resp.append(rv)
                    ListCommit.objects.create(
                        query=query, heading=pd[i]['fields']['name'],
                        platform="Phabricator", created_on=date_time,
                        redirect="T" + str(pd[i]['id']),
                        status=pd[i]['fields']['status']['name'],
                        owned=pd[i]['fields']['authorPHID'] == phid,
                        assigned= pd[i]['fields']['ownerPHID'] == True
                        or phid == pd[i]['fields']['ownerPHID']
                    )
            if i < len_gd:
                date_time = utc.localize(datetime.strptime(gd[i]['created'].split(".")[0],"%Y-%m-%d %H:%M:%S")
                                        .replace(minute=0, second=0, microsecond=0))
                if date_time <= query.queryfilter.end_time and date_time >= query.queryfilter.start_time:
                    date_time = date_time.replace(hour=0, minute=0, second=0, microsecond=0)
                    status = gd[i]['status'].lower()
                    if (status_name is True or status in status_name
                    or (status == "open" in status_name)):
                        rv = {
                           "time": date_time.isoformat(),
                           "gerrit": True,
                           "status": gd[i]['status'],
                           "owned": True
                        }
                        resp.append(rv)
                    ListCommit.objects.create(
                        query=query, heading=gd[i]['subject'],
                        platform="Gerrit", created_on=date_time,
                        redirect=gd[i]['change_id'], status=gd[i]['status'],
                        owned=True, assigned=True
                    )

            if i < len_ghd:
                try:
                    if ghdRateLimitTriggered is not True:
                        if GITHUB_FALLBACK_TO_PR == False:
                            date_time = utc.localize(datetime.strptime(
                            ghd[i]['commit']['committer']['date'].split(".")[0],"%Y-%m-%dT%H:%M:%S")
                            .replace(minute=0, second=0, microsecond=0))

                            rv = {
                            "time": date_time.isoformat(),
                            "github":True,
                            "status":"merged",
                            "owned":"True"
                            }
                            resp.append(rv)

                            ListCommit.objects.create(
                            query=query, heading = ghd[i]["commit"]["message"],
                            platform="Github", created_on=date_time,
                            redirect=ghd[i]["html_url"], status="merged", owned=True,
                            assigned=True
                            )
                        else:
                            date_time = utc.localize(datetime.strptime(
                            ghd[i]['closed_at']
                            .split(".")[0],"%Y-%m-%dT%H:%M:%S")
                            .replace(minute=0, second=0, microsecond=0))

                            rv = {
                            "time": date_time.isoformat(),
                            "github":True,
                            "status":"merged",
                            "owned":"True"
                            }
                            resp.append(rv)

                            ListCommit.objects.create(
                            query=query, heading = ghd[i]["title"],
                            platform="Github", created_on=date_time,
                            redirect=ghd[i]["html_url"], status="merged", owned=True,
                            assigned=True
                            )
                except:
                    ghdRateLimitTriggered = True
                    ghd_rate_limit_message[0] = ghd[i]['rate-limit-message']
                    ghd.clear()

    return resp


async def get_data(urls, request_data, loop, gerrit_response, phab_response,
 github_response, phid, full_names):
    """
    :Summary: Start a session and fetch the data.
    :param urls: URLS to be fetched.
    :param request_data: Request Payload to be sent.
    :param loop: asyncio event loop.
    :param gerrit_response: Store response data to the requests from Gerrit URLs
    :param phab_response: Store response data to the requests from Phabricator URLs
    :param phid: Phabricator ID of the user
    :return:
    """
    tasks = []
    async with ClientSession() as session:
        tasks.append(loop.create_task((get_gerrit_data(urls[1], session,
         gerrit_response, full_names))))
        tasks.append(loop.create_task((get_task_authors(urls[0], request_data
        , session, phab_response, phid, full_names))))
        tasks.append(loop.create_task((get_task_assigner(urls[0], request_data,
         session, phab_response, full_names))))
        tasks.append(loop.create_task((get_github_data(urls[2], request_data[3]
        , session, github_response, full_names))))
        await asyncio.gather(*tasks)


def getDetails(username, gerrit_username, github_username, createdStart,
 createdEnd, phid, query, users):
    """
    :Summary: Get the contributions of the user
    :param username: Fullname of the user.
    :param gerrit_username: Gerrit username of the user.
    :param createdStart: Start timeStamp from which the contributions has to be fetched.
    :param createdEnd: End timestamp till which the contributions has to be fetched.
    :param phid: Phabricator ID of the user.
    :param query: Query Modal Object.
    :param users: List of previous, current and next users Fullname's
    :return: Response Object with query, contributions of user, query filters etc.
    """

    if isinstance(username, float):
        username = ''

    if isinstance(gerrit_username, float):
        gerrit_username = ''

    if isinstance(github_username, float):
        github_username = ''

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    phab_response = []
    gerrit_response = []
    github_response = []
    full_names = {"phab_full_name":"","gerrit_full_name":"","github_full_name":""}
    github_rate_limit_message = ['']

    api_endpoints = deepcopy(API_ENDPOINTS)
    request_data = deepcopy(REQUEST_DATA)

    api_endpoints[1][0] = api_endpoints[1][0].format(gerrit_username=gerrit_username)
    api_endpoints[1][1] = api_endpoints[1][1].format(gerrit_username=gerrit_username)
    api_endpoints[2][0] = api_endpoints[2][0].format(github_username=github_username)
    api_endpoints[2][1] = api_endpoints[2][1].format(github_username=github_username)

    request_data[0]['constraints[authorPHIDs][0]'] = username
    request_data[0]['constraints[createdStart]'] = int(createdStart)
    request_data[0]['constraints[createdEnd]'] = int(createdEnd)

    request_data[1]['constraints[assigned][0]'] = username
    request_data[1]['constraints[createdStart]'] = int(createdStart)
    request_data[1]['constraints[createdEnd]'] = int(createdEnd)

    request_data[2]['constraints[usernames][0]'] = username

    request_data[3]['github_username'] = github_username
    request_data[3]['createdStart'] = int(createdStart)
    request_data[3]['createdEnd'] = int(createdEnd)


    start_time = time.time()
    loop.run_until_complete(get_data(urls=api_endpoints, request_data=request_data,
                                     loop=loop,gerrit_response=gerrit_response,
                                     phab_response=phab_response,
                                     github_response=github_response,
                                     full_names=full_names, phid=phid))
    print(time.time() - start_time)
    formatted = format_data(phab_response, gerrit_response, github_response,
    github_rate_limit_message, query, phid[0])
    match_percent = fuzzyMatching(control=users[1], full_names=full_names)

    return Response({
        'query': query.hash_code,
        'meta':{
        'full_names':full_names,
        'rate_limits':{
        'github_rate_limit_message':github_rate_limit_message[0]
        },
        'match_percent':match_percent
        },
        "result": formatted,
        'previous': users[0],
        'current': users[1],
        'next': users[2],
        'current_gerrit': gerrit_username,
        'current_phabricator': username,
        'current_github': github_username,
        'filters': {
            'start_time': query.queryfilter.start_time,
            'end_time': query.queryfilter.end_time,
            'status': query.queryfilter.status
        }
    })


class DisplayResult(APIView):
    """
    :Summary: Create a Request Payload to the API that fetches the contributions of the user.
    """
    http_method_names = ['get']

    def get(self, request, *args, **kwargs):
        phid = [False]
        query = get_object_or_404(Query, hash_code=self.kwargs['hash'])
        if query.file:
            # get the data from CSV file
            try:
                file = read_csv(query.csv_file, encoding="latin-1")
                try:
                    if 'user' in request.GET:
                        user = file[file['fullname'] == request.GET['user']]
                        if user.empty:
                            return Response({'message': 'User not found', 'error': 1},
                             status=status.HTTP_404_NOT_FOUND)
                        else:
                            ind = user.index[0]
                            user = user.iloc[0, :]
                            username = user['Phabricator']
                            gerrit_username = user['Gerrit']
                            github_username = user['Github']
                            next_user = get_next_user(file, int(ind))
                            prev_user = get_prev_user(file, int(ind))
                    else:
                        user = file.head(1).iloc[0, :]
                        ind = 0
                        temp = True
                        while isnull(user['fullname']) or (isnull(user['Gerrit'])
                        and isnull(user['Phabricator']) and isnull(user['Github'])):
                            ind += 1
                            if ind >= len(file):
                                temp = False
                                break
                            user = file.iloc[ind, :]

                        if not temp:
                            return Response({
                                'message': 'OOPS! We couldn\'t find the full name \
                                 or one of the Wikimedia account usernames for some user(s) in the CSV file.',
                                'error': 1
                            }, status=status.HTTP_404_NOT_FOUND)

                        user = file.iloc[ind, :]
                        username = user['Phabricator']
                        gerrit_username = user['Gerrit']
                        github_username = user['Github']
                        prev_user = None
                        next_user = get_next_user(file, ind)
                except KeyError:
                    return Response({
                        'message': 'CSV file uploaded is not in the supported \
                        format. Click on ⓘ (Information icon) to check the format.',
                        'error': 1
                    }, status=status.HTTP_400_BAD_REQUEST)
            except FileNotFoundError:
                return Response({'message': 'Not Found', 'error': 1},
                 status=status.HTTP_404_NOT_FOUND)

            paginate = [prev_user, user['fullname'], next_user]
        else:
            users = list(query.queryuser_set.all())
            if 'user' in request.GET:
                user = query.queryuser_set.filter(fullname=request.GET['user'])
                if not user.exists():
                    return Response({
                        'message': 'Not Found',
                        'error': 1
                    }, status=status.HTTP_404_NOT_FOUND)
            else:
                user = users
                if len(user) == 0:
                    return Response({
                        'message': 'Not Found',
                        'error': 1
                    }, status=status.HTTP_404_NOT_FOUND)

            user = user[0]
            if len(users) != 1:
                prev_user = users.index(user) - 1
                next_user = users.index(user) + 1

                if len(users) > next_user:
                    next_user = users[next_user].fullname
                else:
                    next_user = None

                if prev_user >= 0:
                    prev_user = users[prev_user].fullname
                else:
                    prev_user = None
            else:
                prev_user = None
                next_user = None

            username = user.phabricator_username
            gerrit_username = user.gerrit_username
            github_username = user.github_username
            paginate = [prev_user, user.fullname, next_user]
        # Any date object needs to be converted to datetime because choose_time_format_method only works with datetime
        createdStart = choose_time_format_method(query.queryfilter.start_time, "str")
        createdEnd = choose_time_format_method(query.queryfilter.end_time, "str")

        return getDetails(username=username, gerrit_username=gerrit_username,
                    github_username=github_username, createdStart=createdStart,
                    createdEnd=createdEnd, phid=phid, query=query, users=paginate)


class GetUserCommits(ListAPIView):
    """
    :Summary: Get all the commits of a user on a specific date.
    """
    http_method_names = ['get']
    serializer_class = UserCommitSerializer

    def get(self, request, *args, **kwargs):
        query = get_object_or_404(Query, hash_code=self.kwargs['hash'])

        try:
            date = utc.localize(datetime.strptime(request.GET['created'], "%Y-%m-%d"))
        except KeyError:
            date = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)

        self.queryset = ListCommit.objects.filter(Q(query=query), Q(created_on=date))
        context = super(GetUserCommits, self).get(request, *args, **kwargs)
        data = []
        status = query.queryfilter.status.split(",")
        for i in context.data['results']:
            if i['status'].lower() in status:
                data.append(i)
            elif (i['status'].lower() == "open" and i['platform'] == 'Phabricator'
            and "p-open" in status):
                data.append(i)
        context.data['results'] = data
        return context


class GetUsers(APIView):
    """
    :Summary: return all the users that belong to a query.
    """
    http_method_names = ['get']

    def get(self, request, *args, **kwargs):
        query = get_object_or_404(Query, hash_code=self.kwargs['hash'])
        if not query.file:
            users = query.queryuser_set.all().values_list('fullname', flat=True)
        else:
            try:
                try:
                    file = read_csv(query.csv_file, encoding="latin-1")
                    users = file[(file['fullname'] == file['fullname']) &
                            ((file['Phabricator'] == file['Phabricator']) |
                            (file['Gerrit'] == file['Gerrit'])
                            | (file['Github'] == file['Github']))]
                    users = users.iloc[:, 0].values.tolist()
                except KeyError:
                    return Response({
                        'message': 'CSV file uploaded is not in the supported \
                        format. Click on ⓘ (Information icon) to check the format.',
                        'error': 1
                    }, status=status.HTTP_400_BAD_REQUEST)
            except FileNotFoundError:
                return Response({'message': 'Not Found', 'error': 1},
                       status=status.HTTP_404_NOT_FOUND)
        return Response({'users': users})


def UserUpdateTimeStamp(data):
    """
    :param data: Hash Code of the Query.
    :return: contributions of the user on updating Query Filter timestamp.
    """
    data['query'] = get_object_or_404(Query, hash_code=data['query'])
    if data['query'].file:
        try:
            file = read_csv(data['query'].csv_file, encoding="latin-1")
            user = file[file['fullname'] == data['username']]
            if user.empty:
                return Response({'message': 'Not Found', 'error': 1},
                      status=status.HTTP_404_NOT_FOUND)
            else:
                username = user.iloc[0]['Phabricator']
                gerrit_username = user.iloc[0]['Gerrit']
                github_username = user.iloc[0]['Github']

        except FileNotFoundError:
            return Response({'message': 'Not Found', 'error': 1}, status=status.HTTP_404_NOT_FOUND)
    else:
        user = data['query'].queryuser_set.filter(fullname=data['username'])
        if not user.exists():
            return Response({'message': 'Not Found', 'error': 1}, status=status.HTTP_404_NOT_FOUND)
        username = user[0].phabricator_username
        gerrit_username =  user[0].gerrit_username
        github_username =  user[0].github_username
    # Any date object needs to be converted to datetime because choose_time_format_method only works with datetime
    createdStart = choose_time_format_method(data["query"].queryfilter.start_time, "str")
    createdEnd = choose_time_format_method(data["query"].queryfilter.end_time, "str")
    phid = [False]
    return getDetails(username=username, gerrit_username=gerrit_username,
            github_username=github_username, createdStart=createdStart,
          createdEnd=createdEnd, phid=phid, query=data['query'], users=['', data['username'], ''])


def UserUpdateStatus(data):
    """
    :param data: Hash Code of the Query.
    :return: contributions of the user on updating Query Filter commit status.
    """
    result = []
    data['query'] = get_object_or_404(Query, hash_code=data['query'])
    status = data['query'].queryfilter.status
    p_open = -1
    if status is not None and status != "":
        status = status.split(",")
        if "p-open" in status:
            try:
                status.remove("p-open")
                p_open = 0
            except ValueError:
                pass

            status.append("open")
        status = '|'.join(status)
        commits = ListCommit.objects.filter(Q(query=data['query']),
                 Q(status__iregex="(" + status + ")"))
    else:
        commits = ListCommit.objects.all()
    for i in commits:
        if i.status.lower() == "open" and i.platform == "Phabricator" and p_open == -1:
            continue

        obj = {
            "time": i.created_on,
            "status": i.status,
            "owned": i.owned,
            "assigned": i.assigned
        }

        if i.platform == 'Phabricator':
            obj['phabricator'] = True
        elif i.platform == 'Gerrit':
            obj['gerrit'] = True
        else:
            obj['github'] = True
        result.append(obj)

    return Response({"result": result})

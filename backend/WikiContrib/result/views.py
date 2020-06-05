from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
import asyncio
from json import loads, JSONDecodeError
from aiohttp import ClientSession
import time
from query.models import Query
from django.shortcuts import get_object_or_404
from pandas import read_csv, isnull
from datetime import datetime
from .models import ListCommit
from .serializers import UserCommitSerializer
from pytz import utc
from WikiContrib.settings import API_TOKEN
from .helper import get_prev_user, get_next_user
import sys
from fuzzywuzzy import fuzz

version = sys.hexversion
version_3_3 = 50530288


def choose_time_format_method(expression,format):
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


def fuzzyMatching(control,full_names):
    """
    :Summary: compare the full names in the full_names dictionary to the control full name
              , gather parcentage similarity in an array and return the average.
    :control: A control full name string against which other full names in full_names dict are compared.
    :full_names: A Dictionary containing a users full names as specified in the neccessary platforms
    :return: returns average parcentage similarity or zero if any of the usernames doesn't exist or
             was not provided.
    """
    _list = []
    ave = 0
    for key in full_names:
        if full_names[key] != "username does not exist" and full_names[key] != "no username provided":
            _list.append(fuzz.WRatio(control,full_names[key]))
        else:
            return 0
    for each in _list:
        ave += each

    return ave/len(_list)


async def get_full_name(data):
    """
    :Summary: Gets users full name per platform and add them to the full_names dictionary.

    """
    if data["platform"] == "phab":
        if data["full_names"]["phab_full_name"] == "":
            if data["request_data"][2]['constraints[usernames][0]'] != "":
                async with data["session"].post(data["url"][1],data=data["request_data"][2]) as response:
                    realname  = await response.read()
                    _data = loads(realname.decode("utf-8"))['result']['data']
                    if(len(_data) != 0):
                        realname = _data[0]['fields']['realName']
                        data["full_names"]["phab_full_name"] = realname
                    else:
                        data["full_names"]["phab_full_name"] = "username does not exist"
            else:
                data["full_names"]["phab_full_name"] = "no username provided"

    if data["platform"] == "gerrit":
        try:
            data["full_names"]["gerrit_full_name"] = data["gerrit_response"][0]["owner"]["name"]
        except:
            if data["url"].split("?")[1].split("&")[0].split(":")[1] == "":
                data["full_names"]["gerrit_full_name"] = "no username provided"
            else:
                data["full_names"]["gerrit_full_name"] = "username does not exist"


async def get_task_authors(url, request_data, session, resp, phid, full_names):
    """
    :Summary: Get the Phabricator tasks that the user authored.
    :param url: URL to be fetched.
    :param request_data: Phabricator token and JSON Request Payload.
    :param session: ClientSession to perform the API request.
    :param resp: Global response array to which the response from the API has to be appended.
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

    await get_full_name(data={"platform":"phab","session":session,"full_names":full_names,"url":url,"request_data":request_data})

async def get_task_assigner(url, request_data, session, resp, full_names):
    """
    :Summary: Get the Phabricator tasks that the user assigned with.
    :param url: URL to be fetched.
    :param request_data: Phabricator token and JSON Request Payload.
    :param session: ClientSession to perform the API request
    :param resp: Global response array to which the response from the API has to be appended.
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

    await get_full_name(data={"platform":"phab","session":session,"full_names":full_names,"url":url,"request_data":request_data})



async def get_gerrit_data(url, session, gerrit_resp,full_names):
    """
    :Summary: Get all the Gerrit tasks of the user.
    :param url: URL to be fetched.
    :param session: ClientSession to perform the API request.
    :param gerrit_resp: Global response array to which the response from the API has to be appended.
    :return: None
    """
    data = []
    if url.split("?")[1].split("&")[0].split(":")[1] != "":
        async with session.get(url) as response:
            data = await response.read()
            try:
                data = loads(data[4:].decode("utf-8"))
            except JSONDecodeError:
                data = []

            gerrit_resp.extend(data)

    await get_full_name(data={"platform":"gerrit","full_names":full_names,"url":url,"gerrit_response":data})


def format_data(pd, gd, query, phid):
    """
    :Summary: Format the data fetched, store the data to Databases and remove the irrelevant data.
    :param pd: Phabricator Data.
    :param gd: Gerrit Data
    :param query: Query Modal Object
    :param phid: Phabricator ID of the user.
    :return: JSON response of all the tasks in which the user involved, in the specified time span.
    """
    resp = []
    len_pd = len(pd)
    len_gd = len(gd)
    if len_pd > len_gd:
        leng = len_pd
    else:
        leng = len_gd
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
                    date_time = datetime.fromtimestamp(int(pd[i]['fields']['dateCreated']))
                    date_time = choose_time_format_method(date_time.replace(hour=0, minute=0, second=0), "str")
                    status = pd[i]['fields']['status']['name'].lower()
                    if status_name is True or status in status_name or (status == "open" and "p-open" in status_name):
                        rv = {
                            "time": date_time,
                            "phabricator": True,
                            "status": pd[i]['fields']['status']['name'],
                            "owned": pd[i]['fields']['authorPHID'] == phid,
                            "assigned": pd[i]['fields']['ownerPHID'] == True or phid == pd[i]['fields']['ownerPHID']
                        }
                        resp.append(rv)
                    ListCommit.objects.create(
                        query=query, heading=pd[i]['fields']['name'],
                        platform="Phabricator", created_on=date_time,
                        redirect="T" + str(pd[i]['id']), status=pd[i]['fields']['status']['name'],
                        owned=pd[i]['fields']['authorPHID'] == phid,
                        assigned= pd[i]['fields']['ownerPHID'] == True or phid == pd[i]['fields']['ownerPHID']
                    )
            if i < len_gd:
                date_time = utc.localize(datetime.strptime(gd[i]['created'].split(".")[0].split(" ")[0],
                                                           "%Y-%m-%d"))
                if date_time.date() < query.queryfilter.end_time and date_time.date() > query.queryfilter.start_time:
                    epouch = choose_time_format_method(date_time.replace(hour=0, minute=0, second=0), "int")
                    status = gd[i]['status'].lower()
                    if status_name is True or status in status_name or (status == "open" in status_name):
                        rv = {
                           "time": epouch,
                           "gerrit": True,
                           "status": gd[i]['status'],
                           "owned": True
                        }
                        resp.append(rv)
                    ListCommit.objects.create(
                        query=query, heading=gd[i]['subject'],
                        platform="Gerrit", created_on=epouch,
                        redirect=gd[i]['change_id'], status=gd[i]['status'],
                        owned=True, assigned=True
                    )
    return resp


async def get_data(urls, request_data, loop, gerrit_response, phab_response, phid, full_names):
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
        tasks.append(loop.create_task((get_gerrit_data(urls[1], session, gerrit_response,full_names))))
        tasks.append(loop.create_task((get_task_authors(urls[0], request_data, session, phab_response, phid, full_names))))
        tasks.append(loop.create_task((get_task_assigner(urls[0], request_data, session, phab_response, full_names))))
        await asyncio.gather(*tasks)


def getDetails(username, gerrit_username, createdStart, createdEnd, phid, query, users):
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

    loop = asyncio.new_event_loop()
    phab_response, full_names, gerrit_response = [], {"phab_full_name":""}, []
    asyncio.set_event_loop(loop)
    urls = [
        ['https://phabricator.wikimedia.org/api/maniphest.search',
        'https://phabricator.wikimedia.org/api/user.search'],
        "https://gerrit.wikimedia.org/r/changes/?q=owner:" + gerrit_username + "&o=DETAILED_ACCOUNTS"
    ]
    request_data = [
        {
            'constraints[authorPHIDs][0]': username,
            'api.token': API_TOKEN,
            'constraints[createdStart]': int(createdStart),
            'constraints[createdEnd]': int(createdEnd)
        },
        {
            'constraints[assigned][0]': username,
            'api.token': API_TOKEN,
            'constraints[createdStart]': int(createdStart),
            'constraints[createdEnd]': int(createdEnd)
        },
        {
            'constraints[usernames][0]':username,
            'api.token': API_TOKEN,
        }
    ]
    start_time = time.time()
    loop.run_until_complete(get_data(urls=urls, request_data=request_data, loop=loop,
                                     gerrit_response=gerrit_response, phab_response=phab_response,
                                     full_names=full_names,phid=phid))
    print(time.time() - start_time)

    formatted = format_data(phab_response, gerrit_response, query, phid[0])
    match_percent = fuzzyMatching(control=users[1],full_names=full_names)
    return Response({
        'query': query.hash_code,
        'match_details':{
        'full_names':full_names,
        'match_percent':match_percent
        },
        "result": formatted,
        'previous': users[0],
        'current': users[1],
        'next': users[2],
        'current_gerrit': gerrit_username,
        'current_phabricator': username,
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
                file = read_csv(query.csv_file,encoding="latin-1")
                try:
                    if 'user' in request.GET:
                        user = file[file['fullname'] == request.GET['user']]
                        if user.empty:
                            return Response({'message': 'User not found', 'error': 1}, status=status.HTTP_404_NOT_FOUND)
                        else:
                            ind = user.index[0]
                            user = user.iloc[0, :]
                            username, gerrit_username = user['Phabricator'], user['Gerrit']
                            next_user = get_next_user(file, int(ind))
                            prev_user = get_prev_user(file, int(ind))
                    else:
                        user = file.head(1).iloc[0, :]
                        ind = 0
                        temp = True
                        while isnull(user['fullname']) or (isnull(user['Gerrit']) and isnull(user['Phabricator'])):
                            ind += 1
                            if ind >= len(file):
                                temp = False
                                break
                            user = file.iloc[ind, :]

                        if not temp:
                            return Response({
                                'message': 'Full name and both Gerrit and Phabricator username cannot be left blank. It is missing for all user(s) in the CSV file!',
                                'error': 1
                            }, status=status.HTTP_404_NOT_FOUND)

                        user = file.iloc[ind, :]
                        username, gerrit_username = user['Phabricator'], user['Gerrit']
                        prev_user = None
                        next_user = get_next_user(file, ind)
                except KeyError:
                    return Response({
                        'message': 'CSV file uploaded is not in the supported format. Click on ⓘ (Information icon) to check the format.',
                        'error': 1
                    }, status=status.HTTP_400_BAD_REQUEST)
            except FileNotFoundError:
                return Response({'message': 'Not Found', 'error': 1}, status=status.HTTP_404_NOT_FOUND)

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

            username, gerrit_username = user.phabricator_username, user.gerrit_username
            paginate = [prev_user, user.fullname, next_user]
        # Any date object needs to be converted to datetime because choose_time_format_method only works with datetime
        createdStart = choose_time_format_method(datetime.strptime(str(query.queryfilter.start_time), "%Y-%m-%d"), "str")
        createdEnd = choose_time_format_method(datetime.strptime(str(query.queryfilter.end_time), "%Y-%m-%d"), "str")
        return getDetails(username=username, gerrit_username=gerrit_username, createdStart=createdStart,
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
            date = datetime.strptime(request.GET['created'], "%Y-%m-%d")
            date = int((date - datetime(1970, 1, 1)).total_seconds())
        except KeyError:
            date = choose_time_format_method(datetime.now().replace(hour=0, minute=0, second=0), "str")

        self.queryset = ListCommit.objects.filter(Q(query=query), Q(created_on=date))
        context = super(GetUserCommits, self).get(request, *args, **kwargs)
        data = []
        status = query.queryfilter.status.split(",")
        for i in context.data['results']:
            if i['status'].lower() in status:
                data.append(i)
            elif i['status'].lower() == "open" and i['platform'] == 'Phabricator' and "p-open" in status:
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
                    file = read_csv(query.csv_file,encoding="latin-1")
                    users = file[(file['fullname'] == file['fullname']) &
                                 ((file['Phabricator'] == file['Phabricator']) | (file['Gerrit'] == file['Gerrit']))]
                    users = users.iloc[:, 0].values.tolist()
                except KeyError:
                    return Response({
                        'message': 'CSV file uploaded is not in the supported format. Click on ⓘ (Information icon) to check the format.',
                        'error': 1
                    }, status=status.HTTP_400_BAD_REQUEST)
            except FileNotFoundError:
                return Response({'message': 'Not Found', 'error': 1}, status=status.HTTP_404_NOT_FOUND)
        return Response({'users': users})


def UserUpdateTimeStamp(data):
    """
    :param data: Hash Code of the Query.
    :return: contributions of the user on updating Query Filter timestamp.
    """
    data['query'] = get_object_or_404(Query, hash_code=data['query'])
    if data['query'].file:
        try:
            file = read_csv(data['query'].csv_file,encoding="latin-1")
            user = file[file['fullname'] == data['username']]
            if user.empty:
                return Response({'message': 'Not Found', 'error': 1}, status=status.HTTP_404_NOT_FOUND)
            else:
                username, gerrit_username = user.iloc[0]['Phabricator'], user.iloc[0]['Gerrit']

        except FileNotFoundError:
            return Response({'message': 'Not Found', 'error': 1}, status=status.HTTP_404_NOT_FOUND)
    else:
        user = data['query'].queryuser_set.filter(fullname=data['username'])
        if not user.exists():
            return Response({'message': 'Not Found', 'error': 1}, status=status.HTTP_404_NOT_FOUND)
        username, gerrit_username = user[0].phabricator_username, user[0].gerrit_username
    # Any date object needs to be converted to datetime because choose_time_format_method only works with datetime
    createdStart = choose_time_format_method(datetime.strptime(str(data["query"].queryfilter.start_time), "%Y-%m-%d"), "str")
    createdEnd = choose_time_format_method(datetime.strptime(str(data["query"].queryfilter.end_time), "%Y-%m-%d"), "str")
    phid = [False]
    return getDetails(username=username, gerrit_username=gerrit_username, createdStart=createdStart,
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
        commits = ListCommit.objects.filter(Q(query=data['query']), Q(status__iregex="(" + status + ")"))
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
        else:
            obj['gerrit'] = True
        result.append(obj)

    return Response({"result": result})

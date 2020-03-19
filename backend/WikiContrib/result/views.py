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



async def get_task_authors(url, request_data, session, resp, phid):
    """
    :Summary: Get the Phabricator tasks that the user authored.
    :param url: URL to be fetched.
    :param request_data: Phabricator token and JSON Request Payload.
    :param session: ClientSession to perform the API request.
    :param resp: Global response array to which the response from the API has to be appended.
    :param phid: Phabricator ID of the user
    :return: None
    """
    print("start get_task_authors")
    s = time.time()
    if request_data['constraints[authorPHIDs][0]'] == '':
        print("end get_task_authors, took :",time.time() - s)
        return
    page, after = True, False
    while page or after is not False:
        page = False
        after = False
        async with session.post(url, data=request_data) as response:
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
                request_data['after'] = after
    print("end get_task_authors, took :",time.time() - s)


async def get_task_assigner(url, request_data, session, resp):
    """
    :Summary: Get the Phabricator tasks that the user assigned with.
    :param url: URL to be fetched.
    :param request_data: Phabricator token and JSON Request Payload.
    :param session: ClientSession to perform the API request
    :param resp: Global response array to which the response from the API has to be appended.
    :return: None
    """
    print("start get_task_assigner")
    s = time.time()
    if request_data['constraints[assigned][0]'] == '':
        print("end get_task_assigner, took :",time.time() - s)
        return
    page, after = True, False
    while page or after is not False:
        page = False
        after = False
        async with session.post(url, data=request_data) as response:
            data = await response.read()
            data = loads(data.decode('utf-8'))['result']
            resp.extend(data['data'])
            if data['cursor']['after']:
                after = data['cursor']['after']
                request_data['after'] = after
    print("end get_task_assigner, took :",time.time() - s)


async def get_gerrit_data(url, session, gerrit_resp):
    """
    :Summary: Get all the Gerrit tasks of the user.
    :param url: URL to be fetched.
    :param session: ClientSession to perform the API request.
    :param gerrit_resp: Global response array to which the response from the API has to be appended.
    :return: None
    """
    print("start get_gerrit_data")
    s = time.time()
    if url.split("?")[1].split("&")[0].split(":")[1] == "":
        print("end get_gerrit_data ,took: ",time.time() - s)
        return
    async with session.get(url) as response:
        data = await response.read()
        try:
            data = loads(data[4:].decode("utf-8"))
        except JSONDecodeError:
            data = []

        gerrit_resp.extend(data)
        print("end get_gerrit_data, took: ",time.time() - s)


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
                    date_time = choose_time_format_method(date_time.replace(hour=0, minute=0, second=0),"str")
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
                    epouch = choose_time_format_method(date_time.replace(hour=0, minute=0, second=0),"int")
                    status = gd[i]['status'].lower()
                    if status_name is True or status in status_name or (status == "open" and "g-open" in status_name):
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

async def get_data(urls, request_data, loop, gerrit_response, phab_response, phid):
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
        tasks.append(loop.create_task((get_gerrit_data(urls[1], session, gerrit_response))))
        tasks.append(loop.create_task((get_task_authors(urls[0], request_data[0], session, phab_response, phid))))
        tasks.append(loop.create_task((get_task_assigner(urls[0], request_data[1], session, phab_response))))
        await asyncio.gather(*tasks)

async def exp_get_data(gerrit_and_phab,current_function,urls, request_data, gerrit_response, phab_response, phid):
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
        for function,current in zip(gerrit_and_phab,current_function):
            if(current == "get_gerrit_data"):
                tasks.append(function(urls[1],session,gerrit_response))
            elif(current == "get_task_authors"):
                tasks.append(function(urls[0],request_data[0],session,phab_response,phid))
            elif(current == "get_task_assigner"):
                tasks.append(function(urls[0],request_data[1],session,phab_response))
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
    phab_response, gerrit_response = [], []
    asyncio.set_event_loop(loop)
    urls = [
        'https://phabricator.wikimedia.org/api/maniphest.search',
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
        }
    ]
    start_time = time.time()
    loop.run_until_complete(get_data(urls=urls, request_data=request_data, loop=loop,
                                     gerrit_response=gerrit_response, phab_response=phab_response,
                                     phid=phid))
    print(time.time() - start_time)
    formatted = format_data(phab_response, gerrit_response, query, phid[0])
    return Response({
        'query': query.hash_code,
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


async def exp_getDetails(users_data,fullname, username, gerrit_username, createdStart, createdEnd, phid, query):
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
    print("start get_details")

    if isinstance(username, float):
        username = ''

    if isinstance(gerrit_username, float):
        gerrit_username = ''

    phab_response, gerrit_response = [], []
    urls = [
        'https://phabricator.wikimedia.org/api/maniphest.search',
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
        }
    ]
    gerrit_and_phab = []
    gerrit_and_phab.append(get_gerrit_data)
    gerrit_and_phab.append(get_task_authors)
    gerrit_and_phab.append(get_task_assigner)
    current_function = ["get_gerrit_data","get_task_authors","get_task_assigner"]
    start_time = time.time()

    await exp_get_data(gerrit_and_phab=gerrit_and_phab,current_function=current_function,urls=urls,
                  request_data=request_data,gerrit_response=gerrit_response,
                  phab_response=phab_response,phid=phid)


    print("end get_details")
    print(time.time() - start_time)
    formatted = format_data(phab_response, gerrit_response, query, phid[0])
    users_data.append({
        'query': query.hash_code,
        "result": formatted,
        "fullname":fullname,
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
        createdStart = choose_time_format_method(datetime.strptime(str(query.queryfilter.start_time),"%Y-%m-%d"),"str")
        createdEnd = choose_time_format_method(datetime.strptime(str(query.queryfilter.end_time),"%Y-%m-%d"),"str")
        return getDetails(username=username, gerrit_username=gerrit_username, createdStart=createdStart,
                          createdEnd=createdEnd, phid=phid, query=query, users=paginate)



class ExpDisplayResult(APIView):
    """
    :Summary: Create a Request Payload to the API that fetches the contributions of the user.
    """
    http_method_names = ['get']

    def get(self, request, *args, **kwargs):
        phid = [False]
        query = get_object_or_404(Query, hash_code=self.kwargs['hash'])
        createdStart = choose_time_format_method(datetime.strptime(str(query.queryfilter.start_time),"%Y-%m-%d"),"str")
        createdEnd = choose_time_format_method(datetime.strptime(str(query.queryfilter.end_time),"%Y-%m-%d"),"str")
        users_data = []

        async def get_details_parallel(users_data,file):
            tasks = []
            for row in file.itertuples():
                tasks.append(exp_getDetails(users_data=users_data,fullname=row.fullname,username=row.Phabricator,gerrit_username=row.Gerrit, createdStart=createdStart,
                            createdEnd=createdEnd, phid=phid, query=query))
            await asyncio.gather(*tasks)
        if query.file:
            # get the data from CSV file
            try:
                file = read_csv(query.csv_file,encoding="latin-1")
                try:
                    print("begin----------------------------")
                    s = datetime.now()
                    asyncio.run(get_details_parallel(users_data,file))
                    s = (datetime.now() - s).total_seconds()
                    print("get_details_parallel took"+" "+str(s))
                    return Response({"perf":s,"users_data":users_data})
                except KeyError:
                    return Response({
                        'message': 'CSV file you have uploaded is not in the supported format. Click on the &#9432; to check the format.(while uploading it)',
                        'error': 1
                    }, status=status.HTTP_400_BAD_REQUEST)
            except FileNotFoundError:
                return Response({'message': 'Not Found', 'error': 1}, status=status.HTTP_404_NOT_FOUND)

        return Response({"message":"Upload Csv file!"},status=status.HTTP_404_NOT_FOUND)


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
            date = choose_time_format_method(datetime.now().replace(hour=0, minute=0, second=0),"str")

        self.queryset = ListCommit.objects.filter(Q(query=query), Q(created_on=date))
        context = super(GetUserCommits, self).get(request, *args, **kwargs)
        data = []
        status = query.queryfilter.status.split(",")
        for i in context.data['results']:
            if i['status'].lower() in status:
                data.append(i)
            elif i['status'].lower() == "open" and i['platform'] == 'Gerrit' and "g-open" in status:
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
    createdStart = choose_time_format_method(datetime.strptime(str(data["query"].queryfilter.start_time),"%Y-%m-%d"),"str")
    createdEnd = choose_time_format_method(datetime.strptime(str(data["query"].queryfilter.end_time),"%Y-%m-%d"),"str")
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
    p_open, g_open = -1, -1
    if status is not None and status != "":
        status = status.split(",")
        if "p-open" in status or "g-open" in status:
            try:
                status.remove("p-open")
                p_open = 0
            except ValueError:
                pass
            try:
                status.remove("g-open")
                g_open = 0
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

        if i.status.lower() == "open" and i.platform == "Gerrit" and g_open == -1:
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

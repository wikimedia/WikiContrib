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
from pandas import read_csv
from datetime import datetime
from .models import ListCommit
from .serializers import UserCommitSerializer
from pytz import utc
from contraband.settings import API_TOKEN


async def get_task_authors(url, request_data, session, resp, phid):
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


async def get_task_assigner(url, request_data, session, resp):
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


async def get_gerrit_data(url, session, gerrit_resp):
    async with session.get(url) as response:
        data = await response.read()
        try:
            data = loads(data[4:].decode("utf-8"))
        except JSONDecodeError:
            data = []
        gerrit_resp.extend(data)


def format_data(pd, gd, query, phid):
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
                    date_time = date_time.replace(hour=0, minute=0, second=0).strftime("%s")
                    if status_name is True or pd[i]['fields']['status']['name'].lower() in status_name:
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
                    epouch = int(date_time.replace(hour=0, minute=0, second=0).strftime("%s"))
                    if status_name is True or gd[i]['status'].lower() in status_name:
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
    tasks = []
    async with ClientSession() as session:
        tasks.append(loop.create_task((get_gerrit_data(urls[1], session, gerrit_response))))
        tasks.append(loop.create_task((get_task_authors(urls[0], request_data[0], session, phab_response, phid))))
        tasks.append(loop.create_task((get_task_assigner(urls[0], request_data[1], session, phab_response))))
        await asyncio.gather(*tasks)


def getDetails(username, gerrit_username, createdStart, createdEnd, phid, query, users):
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
        'filters': {
            'start_time': query.queryfilter.start_time,
            'end_time': query.queryfilter.end_time,
            'status': query.queryfilter.status
        }
    })


class DisplayResult(APIView):
    http_method_names = ['get']

    def get(self, request, *args, **kwargs):
        phid = [False]
        query = get_object_or_404(Query, hash_code=self.kwargs['hash'])
        if query.file:
            # get the data from CSV file
            try:
                file = read_csv(query.csv_file)
                try:
                    if 'user' in request.GET:
                        user = file[file['fullname'] == request.GET['user']]
                        if user.empty:
                            return Response({'message': 'Not Found', 'error': 1}, status=status.HTTP_404_NOT_FOUND)
                        else:
                            username, gerrit_username = user.iloc[0, :]['Phabricator'], user.iloc[0, :]['Gerrit']
                            if user.index[0] != 0:
                                prev_user = file.iloc[user.index[0]-1, :]['fullname']
                            else:
                                prev_user = None

                            if user.index[0] != len(file) - 1:
                                next_user = file.iloc[user.index[0]+1, :]['fullname']
                            else:
                                next_user = None
                    else:
                        user = file.head(1)
                        username, gerrit_username = user['Phabricator'][0], user['Gerrit'][0]
                        prev_user = None
                        next_user = file.iloc[1, :]['fullname']

                except KeyError:
                    return Response({'message': 'CSV file is not in specified format!!', 'error': 1},
                                    status=status.HTTP_400_BAD_REQUEST)
            except FileNotFoundError:
                return Response({'message': 'Not Found', 'error': 1}, status=status.HTTP_404_NOT_FOUND)

            paginate = [prev_user, user.iloc[0, :]['fullname'], next_user]
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

        createdStart = query.queryfilter.start_time.strftime('%s')
        createdEnd = query.queryfilter.end_time.strftime('%s')

        return getDetails(username=username, gerrit_username=gerrit_username, createdStart=createdStart,
                          createdEnd=createdEnd, phid=phid, query=query, users=paginate)


class UserUpdateTimeStamp(APIView):
    http_method_names = ['get']

    def get(self, request, *args, **kwargs):
        data = request.session['data'].copy()
        del request.session['data']
        data['query'] = get_object_or_404(Query, hash_code=data['query'])
        if data['query'].file:
            try:
                file = read_csv(data['query'].csv_file)
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
                return Response({'message': 'Not Found', 'error': 1}, status=status.HTTP_400_BAD_REQUEST)
            username, gerrit_username = user[0].phabricator_username, user[0].gerrit_username

        createdStart = data['query'].queryfilter.start_time.strftime('%s')
        createdEnd = data['query'].queryfilter.end_time.strftime('%s')
        phid = [False]
        return getDetails(username=username, gerrit_username=gerrit_username, createdStart=createdStart,
                          createdEnd=createdEnd, phid=phid, query=data['query'], users=[])


class UserUpdateStatus(APIView):
    http_method_names = ['get']

    def get(self, request, *args, **kwargs):
        data = request.session['data'].copy()
        del request.session['data']
        result = []
        data['query'] = get_object_or_404(Query, hash_code=data['query'])
        status = data['query'].queryfilter.status
        if status is not None and status != "":
            status = status.replace(",", "|")
            commits = ListCommit.objects.filter(Q(query=data['query']), Q(status__iregex="(" + status + ")"))
        else:
            commits = ListCommit.objects.all()
        for i in commits:
            obj = {
                "time": i.created_on,
                "status": i.status,
                "owned": i.owned,
                "assigned": i.assigned
            }
            if i.platform == 'phabricator':
                obj['phabricator'] = True
            else:
                obj['gerrit'] = True
            result.append(obj)

        return Response({"result": result})


class GetUserCommits(ListAPIView):
    http_method_names = ['get']
    serializer_class = UserCommitSerializer

    def get(self, request, *args, **kwargs):
        query = get_object_or_404(Query, hash_code=self.kwargs['hash'])
        try:
            date = datetime.strptime(request.GET['created'], "%Y-%m-%d")
            date = int((date - datetime(1970, 1, 1)).total_seconds())
        except KeyError:
            date = datetime.now().date().strftime("%s")
        status = query.queryfilter.status
        if status is not None and status != "":
            self.queryset = ListCommit.objects.filter(Q(query=query), Q(created_on=date),
                                                  Q(status__iregex="(" + status.replace(",", "|") + ")"))
        else:
            self.queryset = ListCommit.objects.filter(Q(query=query), Q(created_on=date))
        return super(GetUserCommits, self).get(request, *args, **kwargs)


class GetUsers(APIView):
    http_method_names = ['get']

    def get(self, request, *args, **kwargs):
        if "username" not in request.GET or len(request.GET['username']) == 0:
            return Response({
                'message': 'Provide the username',
                'error': 1
            }, status=status.HTTP_400_BAD_REQUEST)
        query = get_object_or_404(Query, hash_code=self.kwargs['hash'])
        if not query.file:
            users = query.queryuser_set.filter(fullname__icontains=
                                request.GET['username']).values_list('fullname', flat=True)
        else:
            try:
                try:
                    file = read_csv(query.csv_file)
                    users = file[file['fullname'].str.contains(request.GET['username'],
                                        case=False)].iloc[:, 0].values.tolist()[:100]
                except KeyError:
                    return Response({
                        'message': 'CSV file is not is specified format!',
                        'error': 1
                    }, status=status.HTTP_400_BAD_REQUEST)
            except FileNotFoundError:
                return Response({'message': 'Not Found', 'error': 1}, status=status.HTTP_404_NOT_FOUND)

        return Response({'users': users, 'search': request.GET['username']})

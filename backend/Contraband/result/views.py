from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
import asyncio
from json import loads
from aiohttp import ClientSession
import time
from query.models import Query
from django.shortcuts import get_object_or_404
from pandas import read_csv
from datetime import datetime
from .models import ListCommit
from pytz import utc
from contraband.settings import API_TOKEN
from django.core.serializers import serialize


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
        data = loads(data[4:].decode("utf-8"))
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
    status_name = query.queryfilter.status.split(",")
    with transaction.atomic():
        ListCommit.objects.filter(query=query).delete()
        for i in range(0, leng):
            if i < len_pd:
                if pd[i]['phid'] not in temp:
                    temp.append(pd[i]['phid'])
                    date_time = datetime.fromtimestamp(int(pd[i]['fields']['dateCreated']))
                    date_time = date_time.replace(hour=0, minute=0, second=0).strftime("%s")
                    if pd[i]['fields']['status']['name'] in status_name:
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
                        platform="phabricator", created_on=date_time,
                        redirect="T" + str(pd[i]['id']), status=pd[i]['fields']['status']['name'],
                        owned=pd[i]['fields']['authorPHID'] == phid,
                        assigned= pd[i]['fields']['ownerPHID'] == True or phid == pd[i]['fields']['ownerPHID']
                    )
            if i < len_gd:
                date_time = utc.localize(datetime.strptime(gd[i]['created'].split(".")[0], "%Y-%m-%d %H:%M:%S"))
                if date_time < query.queryfilter.end_time and date_time > query.queryfilter.start_time:
                    epouch = int(date_time.replace(hour=0, minute=0, second=0).strftime("%s"))
                    if gd[i]['status'] in status_name:
                        rv = {
                           "time": epouch,
                           "gerrit": True,
                           "status": gd[i]['status'],
                           "owned": True
                        }
                        resp.append(rv)
                    ListCommit.objects.create(
                        query=query, heading=gd[i]['subject'],
                        platform="gr", created_on=epouch,
                        redirect=gd[i]['change_id'], status=gd[i]['status'],
                        owned=pd[i]['fields']['authorPHID'] == phid,
                        assigned=pd[i]['fields']['ownerPHID'] == True or phid == pd[i]['fields']['ownerPHID']
                    )
    return resp


async def get_data(urls, request_data, loop, gerrit_response, phab_response, phid):
    tasks = []
    async with ClientSession() as session:
        tasks.append(loop.create_task((get_gerrit_data(urls[1], session, gerrit_response))))
        tasks.append(loop.create_task((get_task_authors(urls[0], request_data[0], session, phab_response, phid))))
        tasks.append(loop.create_task((get_task_assigner(urls[0], request_data[1], session, phab_response))))
        await asyncio.gather(*tasks)


def getDetails(username, gerrit_username, createdStart, createdEnd, phid, users):
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
        "users": users,
        "result": formatted
    })


class DisplayResult(APIView):
    http_method_names = ['get']

    def get(self, request, *args, **kwargs):
        phid = [False]
        users = []
        query = get_object_or_404(Query, hash_code=self.kwargs['hash'])
        if query.file:
            # get the data from CSV file
            try:
                file = read_csv(query.csv_file)
                j = 1
                try:
                    users = file.iloc[:, 0].values.tolist()
                    if 'user' in request.GET:
                            user = file[file['fullname'] == request.GET['user']]
                    else:
                        user = file.head(1)
                        j = 0
                    if not user.empty:
                        username, gerrit_username = user['Phabricator'][j], user['Gerrit'][j]
                    else:
                        return Response({'message': 'Not Found', 'error': 1}, status=status.HTTP_404_NOT_FOUND)
                except KeyError:
                    return Response({'message': 'CSV file is not in specified format!!', 'error': 1},
                                    status=status.HTTP_400_BAD_REQUEST)
            except FileNotFoundError:
                return Response({'message': 'Not Found', 'error': 1}, status=status.HTTP_404_NOT_FOUND)

        else:
            if 'user' in request.GET:
                user = query.queryuser_set.filter(fullname=request.GET['user'])
            else:
                user = query.queryuser_set.all()[0]
            users.extend(query.queryuser_set.all().values('fullname'))
            if user is None:
                return Response({"message": "Not Found", "error": 1}, status=status.HTTP_404_NOT_FOUND)

            username, gerrit_username = user.phabricator_username, user.gerrit_username

        createdStart = query.queryfilter.start_time.strftime('%s')
        createdEnd = query.queryfilter.end_time.strftime('%s')

        return getDetails(username=username, gerrit_username=gerrit_username, createdStart=createdStart,
                          createdEnd=createdEnd, phid=phid, users=users)


class UserUpdateTimeStamp(APIView):
    http_method_names = ['post']

    def post(self, request, *args, **kwargs):
        data = request.session['data'].copy()
        del request.session['data']
        if data['query'].file:
            try:
                file = read_csv(data['query'].csv_file)
                try:
                    user = file[file['fullname'] == request.GET['user']]
                    username, gerrit_username = user['Phabricator'][1], user['Gerrit'][1]
                except KeyError:
                    return Response({'message': 'CSV file is not in specified format!!', 'error': 1},
                                    status=status.HTTP_400_BAD_REQUEST)
            except FileNotFoundError:
                return Response({'message': 'Not Found', 'error': 1}, status=status.HTTP_404_NOT_FOUND)

        else:
            if 'user' in request.GET:
                user = data['query'].queryuser_set.filter(fullname=request.GET['user'])
            else:
                user = data['query'].queryuser_set.all()[0]
            username, gerrit_username = user.phabricator_username, user.gerrit_username

        createdStart = data['query'].queryfilter.start_time.strftime('%s')
        createdEnd = data['query'].queryfilter.end_time.strftime('%s')
        phid = [False]
        return getDetails(username=username, gerrit_username=gerrit_username, createdStart=createdStart,
                          createdEnd=createdEnd, phid=phid, users=[])


class UserUpdateStatus(APIView):
    http_method_names = ['get']

    def get(self, request, *args, **kwargs):
        data = request.session['data'].copy()
        del request.session['data']
        result = []
        status = data['query'].queryfilter.status.split(",")
        commits = ListCommit.objects.filter(Q(query=data['query']), Q(status__in=status))
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

        return result


class GetUserCommits(APIView):
    http_method_names = ['get']

    def get(self, request, *args, **kwargs):
        query = get_object_or_404(Query, hash_code=self.kwargs['query'])
        contribs = ListCommit.objects.filter(Q(query=query), Q(created_on=self.kwargs['created']))
        return Response(serialize("json", contribs))


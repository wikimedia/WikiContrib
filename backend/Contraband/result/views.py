from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
import asyncio
from json import loads
from aiohttp import ClientSession
import time
from query.models import Query
from django.shortcuts import get_object_or_404
import requests
from pandas import read_csv
from contraband.settings import MEDIA_ROOT


async def fetch(url, session):
    async with session.get(url) as response:
        data = await response.read()
        return data


async def get_task_authors(url, request_data, session):
    page, after = True, False
    while page or after is not False:
        page = False
        after = False
        print("came for authors")
        async with session.post(url, data=request_data) as response:
            print("Came here and waiting 1")
            data = await response.read()
            data = loads(data.decode('utf-8'))['result']
            if data['cursor']['after']:
                after = data['cursor']['after']
                request_data['after'] = after


async def get_task_assigner(url, request_data, session):
    page, after = True, False
    while page or after is not False:
        page = False
        after = False
        print("came for assigners")
        async with session.post(url, data=request_data) as response:
            print("Came here and waiting 2")
            data = await response.read()
            data = loads(data.decode('utf-8'))['result']
            if data['cursor']['after']:
                after = data['cursor']['after']
                request_data['after'] = after


async def get_gerrit_data(url, session):
    print("came for gerrit")
    async with session.get(url) as response:
        print("Came here and waiting 3")
        data = await response.read()


def format_data(pd, gd):
    print(pd)
    print(gd)
    return [
        "asd", "qwe"
    ]


async def get_data(urls, request_data, loop):
    tasks = []
    async with ClientSession() as session:
        tasks.append(loop.create_task((get_gerrit_data(urls[1], session))))
        tasks.append(loop.create_task((get_task_authors(urls[0], request_data[0], session))))
        tasks.append(loop.create_task((get_task_assigner(urls[0], request_data[1], session))))
        await asyncio.gather(*tasks)


class DisplayResult(APIView):
    http_method_names = ['get']

    def get(self, request, *args, **kwargs):

        query = get_object_or_404(Query, hash_code=self.kwargs['hash'])
        if query.file:
            # get the data from CSV file
            file = read_csv(MEDIA_ROOT + query.hash_code + ".csv")

            pass
        else:
            user = query.queryuser_set.filter(fullname=request.data['user'])
            if user is None:
                return Response({"message": "Not Found", "error": 1}, status=status.HTTP_404_NOT_FOUND)

            username, gerrit_username = user.phabricator_username, user.gerrit_username

        createdStart = query.queryfilter.start_time.strftime('%s')
        createdEnd = query.queryfilter.end_time.strftime('%s')

        loop = asyncio.new_event_loop()
        phab_response, gerrit_response = set(), []
        asyncio.set_event_loop(loop)
        urls = [
            'https://phabricator.wikimedia.org/api/maniphest.search',
            "https://gerrit.wikimedia.org/r/changes/?q=owner:" + gerrit_username + "&o=DETAILED_ACCOUNTS"
        ]
        request_data = [
            {
                'constraints[authorPHIDs][0]': username,
                'api.token': "api-hfubeyafa7gd7vwfi7jvz4nbskut",
                'constraints[createdStart]': int(createdStart),
                'constraints[createdEnd]': int(createdEnd)
            },
            {
                'constraints[assigned][0]': username,
                'api.token': "api-hfubeyafa7gd7vwfi7jvz4nbskut",
                'constraints[createdStart]': int(createdStart),
                'constraints[createdEnd]': int(createdEnd)
            }
        ]
        start_time = time.time()
        data = loop.run_until_complete(get_data(urls=urls, request_data=request_data, loop=loop))
        print(time.time() - start_time)
        formatted = format_data(phab_response, gerrit_response)
        return Response(formatted)


class Sync(APIView):

    def get(self, request, *args, **kwargs):
        query = get_object_or_404(Query, hash_code=self.kwargs['hash'])
        createdStart = query.queryfilter.start_time.strftime('%s')
        createdEnd = query.queryfilter.end_time.strftime('%s')

        loop = asyncio.new_event_loop()
        username, gerrit_username = "Aklapper", "Aklapper"
        phab_response, gerrit_response = [], []
        urls = [
            'https://phabricator.wikimedia.org/api/maniphest.search',
            "https://gerrit.wikimedia.org/r/changes/?q=owner:" + gerrit_username
        ]
        request_data = [
            {
                'constraints[authorPHIDs][0]': username,
                'api.token': "api-hfubeyafa7gd7vwfi7jvz4nbskut",
                'constraints[createdStart]': int(createdStart),
                'constraints[createdEnd]': int(createdEnd)
            },
            {
                'constraints[assigned][0]': username,
                'api.token': "api-hfubeyafa7gd7vwfi7jvz4nbskut",
                'constraints[createdStart]': int(createdStart),
                'constraints[createdEnd]': int(createdEnd)
            }
        ]
        start_time = time.time()
        while 1:
            print("came of autors")
            resp = requests.post(urls[0], data=request_data[0])
            data = loads(resp.content.decode('utf-8'))['result']
            if data['cursor']['after']:
                request_data[0]['after'] = data['cursor']['after']
            else:
                break

        while 1:
            print("Came for assiginers")
            response = requests.post(urls[0], data=request_data[1])
            data = loads(response.content.decode('utf-8'))['result']
            if data['cursor']['after']:
                request_data[1]['after'] = data['cursor']['after']
            else:
                break

        print("came for gerrit")
        response = requests.get(urls[1])

        print("End time:", end=" ")
        print(time.time() - start_time)

        return Response({'message': "asd"})


# check if csv file exists on file as true
# if exists then check for the username exists in csv file
# if both username and query exists then take the phabricator and gerrit contribs.
# store the data in form of a set (from phabricator), gerrit in form of a list.
# once all the api fetch is completed. format the data and take only the required data
# response format has to be decided.
# pass the data from making a query.
# once the queryFilters are edited perform the search again (i.e call the method).

# perform error checking.
from datetime import datetime
from json import loads


async def get_github_pr_by_org(orgs, url, request_data, session, github_resp):
    """
    :Summary: make concurrent requests to get the users PRs to two wikimedia
              accounts on github.
    :param url: URL to be fetched.
    :param session: ClientSession to perform the API request.
    :param request_data: data that is expected to be in the request but not in
                         the url string link headers
    :param github_resp: Global response array to which the response from the API
                        has to be appended.
    :return: None
    """
    if request_data["github_username"] == "":
        return

    createdStart = datetime.fromtimestamp(request_data["createdStart"])
    createdEnd = datetime.fromtimestamp(request_data["createdEnd"])
    headers = {"Authorization":"token "+request_data["github_access_token"]}
    orgs_filter = """user:{org_0}+user:{org_1}""".format(org_0=orgs[0], org_1=orgs[1])

    url = ("""{url}+{orgs_filter}+merged:{createdStartIsoFormat}..{createdEndIsoFormat}"""
           .format(url=url, orgs_filter=orgs_filter,
            createdStartIsoFormat=createdStart.isoformat()+"Z",
            createdEndIsoFormat=createdEnd.isoformat()+"Z"))

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


    while url:
        async with session.get(url, headers=headers) as response:
            data = await response.read()
            try:
                data = loads(data.decode("utf-8"))["items"]
                github_resp.extend(data)
                url = getNextUrlOrNone(response)
            except:
                github_resp.extend([{"rate-limit-message":"OOPS! Github's API rate limit \
                seems to have exceeded. You could try again in a couple of minutes."}])
                url = None

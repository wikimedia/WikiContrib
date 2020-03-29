
# Introduction

Visualization of contributions for users added via the CSV file upload feature needs to be in a tabular form (a list view).

| USER       | GERRIT     | PHABRICATOR    | TOTAL    |
| ---------- | :--------: | :------------: | -------- |
| username 1 | 100        | 250            | 350      |
| username 2 | 0          | 300            | 300      |

**_Example of a list view_**

-------------------------------------------------------------------------------------------------------------------------


 One of the possible use cases of this feature - a hackathon scholarship committee uses it to eliminate applicants with little or no contributions to Wikimedia projects from the scholarship list. This feature can also help decide between promising candidates.
While developing the list view, we identified that there are limits on the frequency of API calls we can make to fetch users' info from Gerrit and Phabricator APIs. This means it would take a long time to populate the complete table. This would not be very pleasant UX as well as would require a lot of API calls each time we access the list views.
The current workaround was to replace the list view with a pager view. Upon searching a filled list from the main page of WikiContrib, instead of presenting results in a list, we present a single page for the first user in the list. This way, each page is one user's query. Each page can be kind of flipped using arrows on the sides of the page which take us to the next user in the list by making another small set of queries. to go to a specific user from the initial list, you can use the search bar and view their page. This way, we could avoid the issue of the list view without sacrificing the user experience.

This document details the research done to figure out ways to overcome this huddle, findings, and problems remaining.
This Document is divided into two possible solutions that have been explored:
 * Utilizing existing asyncio package for concurrent requests.
 * Scraping Bitergia Dev tool console

-----------------------------------------------------------------------------------------------------------------------

## Asyncio
Asyncio is a package used for processing potential thread blocking operations concurrently. We made use of asyncio for fetching users data from the APIs and it helped to speed up the time taken to fetch a single user data significantly.
For this research, we tried finding out how possible it is to make use of the same asyncio to fetch multiple users data concurrently as well.

### Setup Details
If you would like to test our implementation and possibly modify the code to improve on our research, [click here](https://github.com/wikimedia/WikiContrib/pull/158) to visit this research's PR and get started

### Findings
We discovered there are costs associated with every additional user data retrieval. By that, I mean that the relationship between the number of users and the time taken to fetch their data is exponential. This is because of phabricator API rate limits.
From the research, the real problems are the two Phabricator endpoints. Gerrit always returns a response in like two seconds tops even when fetching like 20 users data.
(if you would love to see how long it takes to fetch a given number of users data, you are welcome to return to "Setup Details" section above because, in addition to API limits, this also depends heavily on a user's internet speed)

### Advantages
The advantage of this approach is that it makes use of Phabricator and gerrit API endpoints directly. This gives it long term maintainability as phabricator and gerrit will consider developers and projects that directly depend on their APIs before making any drastic change.

### Challenges
Like we already discussed, there are API rate limits while using these endpoints, this means that for this approach to become viable, we need to implement a sort of cache to ensure that we don't always hit the endpoints unless when necessary.
But then, talking about cache also brings up the issue of cache invalidation.
Phabricator and gerrit both have webhook features that could be used to notify the application whenever a cached data has been modified so the cache can be updated accordingly. For phabricator though, this requires access to herald tool which can only to provided by people higher up in wikimedia organization.

--------------------------------------------------------------------------------------------------------------------------

## Scraping Bitergia Dev tool console
Bitergia is a tool used to visualize the contributions of open-source contributors to various open-source tools. It has an editor-like feature called dev-tool console that allows developers to type in queries about user/users contributions to a project on one side and get the result in JSON format on the other site. In this approach, we tried to programmatically write these queries and retrieve results using web scraping.

### Setup Details
If you would like to test our implementation and possibly modify the code to improve on our research, [click here](https://github.com/wikimedia/WikiContrib/pull/158) to visit this research's PR and get started

### Findings
Minus the time it takes to properly startup chrome driver (this varies depending on system power), the query latency seems to be very low.

### Advantages
The advantages of this approach revolve around the fact that it is fast enough for our use case, which simply means that we won't be needing to set up our own cache and won't be needed access to any webhook or permissions we don't already have.

### Challenges
Since this approach is a bit hacky, there is no guarantee that bitergia won't make any drastic change that would break our application. This means we might have to be tweaking the code and making changes more often than we would like.
Another obvious problem is that since the data being returned is of a very different format compared to what we are currently handling in the backend, it means that we will be making some serious changes to the code base

---------------------------------------------------------------------------------------------------------------------------

## Conclusion
Both of these approaches discussed above have their advantages and disadvantages so it all depends on what are most important to us and what can be sacrificed to achieve it.
These are by no means the only possible approaches to solving this problem. You are welcome to research other approaches that you believe would be better, send a PR showing you code and modify this document to include your own research.

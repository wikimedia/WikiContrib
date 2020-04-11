# WikiContrib

WikiContrib is a tool for Wikimedia community members to visualize their technical contributions within a specified time range. Currently, the tool gathers statistics from [Phabricator](https://phabricator.wikimedia.org/) (task management system) and [Gerrit](https://gerrit.wikimedia.org/) (code collaboration platform).

This project was proposed in the [Google Summer of Code 2019](https://www.mediawiki.org/wiki/Google_Summer_of_Code/2019) and developed as an internship project by [Rammanoj Potla](https://github.com/rammanoj). It also received small improvements from students as part of the Google Code-in contest.

Technologies used: Django (Python), React (Javascript)

<img src="https://phab.wmfusercontent.org/file/data/fqbz7mddtm53ew5f7xhn/PHID-FILE-lobab5xzkuu7zxxhdmxb/wikicontrib.png?raw" width="400" />

## Planned features
WikiContrib is participating in [Outreachy](https://www.outreachy.org/) Round 20. Some of the features planned for the Outreachy project "Gather and analyze user contributions on wiki & Github" and for the future to enhance the project are:
* Counting technical contributions made by a user on-wiki such as [modules](https://www.mediawiki.org/wiki/Lua_scripting) and [templates](https://www.mediawiki.org/wiki/Help:Templates), [user scripts & Gadgets](https://www.mediawiki.org/wiki/Gadget_kitchen), etc.
* Counting technical contributions made to Github repositories under [Wikimedia](https://github.com/wikimedia) and other popular projects that are not necessarily under the Wikimedia account (e.g., [WikiEduDashboard](https://github.com/WikiEducationFoundation/WikiEduDashboard), [apps-android-commons](https://github.com/commons-app/apps-android-commons), etc.).
* Anything else that can be measured as per the [Technical Contributors Map](https://www.mediawiki.org/wiki/Developer_Advocacy/Metrics#Technical_Contributors_Map).
* Fetch the best user avatar and about information from the possible venues and display it alongside the contribution statistics.
* New layouts for visualizing contributions.

## Using the tool
To view a community members’ contributions, provide their full name, Gerrit username, and Phabricator username. By default, the tool searches for their contributions in the past year.  There are options to filter by timestamp and issue type (for example: merged, open, etc.)
There is also a feature to upload a list of usernames in a CSV format and view contributions for several community members altogether (this feature is still in experimental mode).

## Getting started
- First, clone the repo `git clone https://github.com/wikimedia/WikiContrib.git`

#### Using Docker Compose
1. Run `cd WikiContrib`
2. To install docker-compose, run `pip install docker-compose`
3. Set up the environment file: Copy contents of `backend/WikiContrib/WikiContrib/.env.example` to a new file `backend/WikiContrib/WikiContrib/.env`. Update it! Most likely you will be making changes only to `DB_NAME`, `DB_USER`, `DB_PASSWORD` and `PHAB_KEY` variables.
4. To start the front-end as well as back-end server, run `docker-compose up --build`.
5. Frontend running at `localhost:3000` and backend running at `localhost:8000`
  ###### NOTE:
  - Use the `--build` flag only when running docker-compose for the first time. For repeated use, simply run `docker-compose up`. This will not reflect the changes you made in you local project setup.
  - Inorder to make the frontend send requests to the local backend, you need to change the code in the file `frontend/WikiContrib-Frontend/src/api.js` and change the value of `BASE_API_URI` to `http://127.0.0.1:8000/`
#### Manually

 This tool has two different components: Frontend & Backend. You will have to set up both for the tool to be fully functional, and the instructions do so are here:
  * [Frontend installation steps](https://github.com/wikimedia/WikiContrib/tree/master/frontend/WikiContrib-Frontend/Install.md)
  * [Backend installation steps](https://github.com/wikimedia/WikiContrib/blob/master/backend/WikiContrib/Install.md)

## Additional links
* API documentation: https://documenter.getpostman.com/view/6222710/SVYurxMj
* Full documentation on using and contributing to the tool: https://wikicontrib.readthedocs.io/
* Steps for hosting are in `DEPLOYING.md`
* For additional questions, come chat with the maintainers on Wikimedia Zulip: https://wikimedia.zulipchat.com/#narrow/stream/220258-gsoc20-outreachy20/topic/WikiContrib

## License
This project is licensed under the [MIT LICENSE](https://github.com/wikimedia/WikiContrib/blob/master/LICENSE)

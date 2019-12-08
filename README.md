# WikiContrib

## Intro

WikiContrib is a tool that helps the scholarship committee reviewers who need developer contribution statistics while reviewing applications for Wikimedia events to get the contributions of the developer from two different platforms

1. Gerrit
2. Phabricator

and represent them in the form of graphs and user contribution activity.

Apart from scholarship committee reviewers, the tool can also be used by all others to view the contributions of the user for the Wikimedia Foundation.

**Technologies used:** Django, Reactjs

## How to use the tool?

To get a user statistics, the Fullname, Gerrit username and phabricator username of the user has to be provided. Full names, Gerrit username, Phabricator username of multiple users can be provided once. Bulk adddition can also be done using the csv file.

The tool creates a query with the usernames provided. Each query has a hash associated with it and each of the queries has a lifetime of 30 days.

For displaying the result, the tool paginates the usernames given and each page displays the contributions and statistics of a single user. There will be a next and previous option provided to get the contributions of next and previous users.

In default, the tool searches for all the contributions of the user in the past one year. This behaviour can be changed by updating the time stamp filter. There is also another filter provided to track the type of issue (like merged, open etc).

## Installation

Initially, clone the repo with the command

```commandline
git clone https://github.com/wikimedia/WikiContrib.git
```

The tool has two different components i.e Backend and Frontend Each of them has their own installation instructions.

[Backend installation file](https://github.com/wikimedia/WikiContrib/blob/master/backend/WikiContrib/Install.md) | [Frontend installation file](https://github.com/wikimedia/WikiContrib/tree/master/frontend/WikiContrib-Frontend/Install.md)

**Note:** You can find the instrucutions of how to host the react apps on toolforge [here](DEPLOYING.md).

## API & Docs

The API documentation of the tool is avialable [here](https://documenter.getpostman.com/view/6222710/SVYurxMj).

Official Documentation: https://wikicontrib.readthedocs.io/

## License

[MIT](https://github.com/wikimedia/WikiContrib/blob/master/LICENSE)

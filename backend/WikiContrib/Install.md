Now, if you type command `ls` (for linux) or `dir` (for windows), you can see a directory named **WikiContrib**. Go inside the directory using the command `cd WikiContrib.` There will be two directories in it:
1. backend
2. frontend

The present doc deals with installing and running `backend`. If you go inside `backend` directory( use command `cd backend`). You can find another directory named `WikiContrib`. It is the main project directory.

# Steps to setup server locally

## Using Docker 

1. Install Docker in your system (https://docs.docker.com/install/)
2. Get to the  Dockerfile directory : `cd backend/WikiContrib`  
3. [Set up environment variables](#set-up-environment-variables)
4. Run `docker build .` to build an image. This will return an `image-id`.
5. Run `docker  run -td  -p 8000:8000  <image-id>` to run the container.



## Manually

1. Create a virtual environment
2. Install the required packages to run the tool
3. Create the phabricator account and generate a Conduit API token
4. Set up environment variables
5. Run the migrations
6. Create super user
7. Run the local server


## Creating a virtual environment:

Virtual environment isolates the entire project. The packages used by different projects will be different and few packages used in a project might not be compatible with another one. So, using a virtual environment sets up packages individually for each project.

One way to create virtual environments in python is using [virtualenv tool](https://pypi.org/project/virtualenv/). If you don't understand the information in the given link, try googling about `creating a python virtualenv on windows and linux`


**Linux**

First Install python3, type the following commands inside `backend` directory
```commandline
sudo apt-get install python3
```

Now you need to install pip3, it manages the python packages

```commandline
sudo apt-get update
sudo apt-get install -y python3-pip
```

Let's Install virtualenv package.
```commandline
pip3 install virtualenv
```

you have successfully installed `virtualenv`. Now let's create a virtual environment.
 ```commandline
virtualenv -p $(which python3) WMWikiContrib
```

The above command creates a virtual environment named `VMWikiContrib`. It creates a directory named `WMWikiContrib` in the current directory. It is recommended to create a virtual environment in `backend` directory. You have successfully created the virtual environment. But you need to activate it now

To activate the virtual environment, type the following command (in the same directory where `WMWikiContrib` is located):
```commandline
source WMWikiContrib/bin/activate
```

**Windows**

First Install python 3 if you don't have it installed already
1. Go to https://www.python.org/downloads/windows/, pick any of the stable releases (preferably python 3.7.5)
and download the required executable for your system (either 32-bits (x86) or 64-bits (x86-64))
Note: Remember that if you get this choice “wrong” and would like to switch to another version of Python, you can just uninstall Python and then re-install it by downloading another installer from https://www.python.org/downloads/windows/

2. Go to the downloaded executable, run it and follow the prompt to install python.
Important: You want to be sure to check the box that says "Add Python 3.x to PATH".

to verify that python was successfully installed, go to you command line and run
```commandline
python -v
```
you should get a reply indicating the python version you are running. If there was an error, it is likely you didn't add python to path during the installation. in that case, you should either google how to do that manually or uninstall and re-install python on your system.
python 3 usually comes with pip pre-installed but if you get any errors while trying to use pip, you can always google about
the error.

Let's Install virtualenv package.
```commandline
pip install virtualenv
```

you have successfully installed `virtualenv`. Now let's create a virtual environment.
 ```commandline
virtualenv WMWikiContrib
```

The above command creates a virtual environment named `WMWikiContrib`. It creates a directory named `WMWikiContrib` in the current directory. It is recommended to create a virtual environment in `backend` directory. You have successfully created a virtual environment, But you need to activate it now

To activate the virtual environment, type the following command (in the same directory where `WMWikiContrib` is located):
```commandline
WMWikiContrib\Scripts\activate
```




## Install the required packages to run the tool:

Now go inside the `WikiContrib` directory (inside `backend`). Install all the packages that are required to run the project using the command.


**Linux**

```commandline
pip install -r requirements.txt
```

**Windows**

```commandline
pip install -r requirements.txt
```
**There are two major errors you might face during the installation**
 1. Could not find a version that satisfies the requirement pytz==2019.1
 2. mysqlclient installation error

 with error 1, one way to fix it is to replace `pytz==2019.1` in the requirements.txt file with `pytz>=2013b`. you should change this back to `pytz==2019.1` after a successful installation.

 Error 2 will probably say something like `error: Microsoft Visual C++ 14.0 is required. Get it with "Microsoft Visual C++ Build Tools": http://landinghub.visualstudio.com/visual-cpp-build-tools`. to fix this error, visit (https://visualstudio.microsoft.com/vs/older-downloads/), download "Microsoft Build Tools 2015 Update 3", run the downloaded file and follow the prompt to complete the installation. If the error persists, you can google about the error or talk about here (https://wikimedia.zulipchat.com/#narrow/stream/220258-gsoc20-outreachy20/topic/WikiContrib)



 To check if `Django` is successfully installed. Type the following command:
```commandline
django-admin --version
```

The output is something like: `2.2.2`.



## Create a Phabricator account and generate a Conduit API token:

Before running the development server, you need to provide an API key to fetch the details from the phabricator. So create a phabricator account from [here](https://phabricator.wikimedia.org/auth/start/?next=%2F). Use **Log In or Register** through Mediawiki(If you don't have a Mediawiki account, you can create it from [here](https://www.mediawiki.org/w/index.php?title=Special:CreateAccount)).

Once you login to the phabricator. You can generate a Conduit API token from `https://phabricator.wikimedia.org/settings/user/{Your username}/page/apitokens/` (fill your username in the link).

Copy the API token, and paste it in the variable named `API_TOKEN` in the file `backend/WikiContrib/WikiContrib/settings.py`

## Set up environment variables
Copy contents of `backend/WikiContrib/WikiContrib/.env.example` to a new file `backend/WikiContrib/WikiContrib/.env`. Update it! Most likely you will be making changes only to `DB_NAME`, `DB_USER`, `DB_PASSWORD` and `PHAB_KEY` variables.


## Run the migrations:

Now, you need to run the migration files. Type the following command:
```commandline
python manage.py migrate
```

Note: For windows users mostly, it is advisable to git-ignore your virtual environment and the "db.sqlite3" file created while runnning migration. the best way to go about this to avoid pushing environment-specific setup to the remote repo is to go to the root ".git" folder of your project, open "info\exclude" file and add these to it:
```commandline
WMWikiContrib
db.sqlite3
```

## Create super user:
You have successfully created the schema now. In order to access the models you need to create a superuser. Use this command:
```commandline
python manage.py createsuperuser
```

The above prompts for username, email and password. The command creates a user with the corresponding username and password. You can see the database tables or models using it.


## Run the local server:
Finally, run the server with the command:
```commandline
python manage.py runserver
```

Hurray!! Now you can access the API. You can get the API doc [here](https://documenter.getpostman.com/view/6222710/SVYurxMj?version=latest).

To see the database tables, you can go to this url: `http://127.0.0.1:8000/admin/` and login with the super user credentials.

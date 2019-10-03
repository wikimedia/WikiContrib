============
Installation
============

Initially, clone the repo with the command.

``git clone https://github.com/wikimedia/Contraband.git``

The tool has two different components(Backend and Frontend). Each of them has their own installation instructions.

Backend
=======

Now, if you type command ``ls``, you can see a directory named **Contraband**. Go inside the directory using the command ``cd Contraband.`` There will be two directories in it:

1. backend
2. frontend

If you go inside ``backend`` directory( use command ``cd backend``). You can find another directory named ``Contraband``. It is the main project backend directory.

**Steps to setup server locally**

1. Create a virtual environment.
2. Install the required packages to run the tool.
3. Create the phabricator account and generate a Conduit API token.
4. Run the migrations.
5. Create super user.
6. Run the local server.


**Creating a virtual environment:**

Virtual environment isolates the entire project. The packages used by different projects will be different and few packages used in a project might not be compatible with another one. So, using virtual environment sets up packages individually to each project.

One way to create virtual environment in python is using `virtualenv tool <https://pypi.org/project/virtualenv/>`_

First Install python3, type the following commands inside ``backend`` directory

``sudo apt-get install python3``

Now you need to install pip3, it manages the python packages

``sudo apt-gt update``

``sudo apt-get install -y python3-pip``

Let's Install virtualenv package.

``pip3 install virtualenv``

you have successfully installed ``virtualenv``. Noe let's create a virtual environment.

``virtualenv -p $(which python3) WMContraband``

The above command creates a virtual environment named ``VMContraband``. It creates a directory named ``WMContraband`` in the current directory. It is recommended to create  virtual environment in ``backend`` directory. You have successfully created the virtual environment. But you need to activate it now.

To activate the virtual environment, type the following command (in the same directory where ``WMContraband`` is located):

``source WMContraband/bin/activate``

**Install the required packages to run the tool:**

Now go inside the ``Contraband`` directory (inside ``backend``). Install all the packages that are required to run the project using the command.

``pip install -r requirements.txt`` 

To check if ``Django`` is successfully installed. Type the following command:

``django-admin --version``

The output is something like: ``2.2.2``.


**Create the phabricator account and generate a Conduit API token:**

Before running the development server, you need to provide an API key to fetch the details from the phabricator. So create a phabricator account from `here <https://phabricator.wikimedia.org/auth/start/?next=%2F>`_. Use **Log In or Register** through Mediawiki(If you don't have a Mediawiki account, you can create it from `here <https://www.mediawiki.org/w/index.php?title=Special:CreateAccount>`_.

Once you login to the phabricator. You can generate a Conduit API token from ``https://phabricator.wikimedia.org/settings/user/{Your username}/page/apitokens/`` (fill your username in the link).

Copy the API token, and paste it in the variable named ``API_TOKEN`` in the file ``backend/Contraband/contraband/settings.py``

**Run the migrations:**

Now, you need to run the migration files. Type the following command:

``python manage.py migrate``

**Create super user:**

You have successfully created the schema now. Inorder to access the models you need to create a superuser. Use this command:

``python manage.py createsuperuser``

The above prompts for username, email and password. The command creates a user with the corresponding username and password. You can see the database tables or models using it.


**Run the local server:**

Finally, run the server with the command:

``python manage.py runserver``

Hurray!! Now you can access the API. You can get the API doc `here <https://documenter.getpostman.com/view/6222710/SVYurxMj?version=latest>`_.

To see the database tables, you can go to this url: ``http://127.0.0.1:8000/admin/`` and login with the above created credentials.



Frontend
========

If you go inside ``frontend`` directory( use command ``cd frontend``). You can find another directory named ``WikiContrib-Frontend``. It is the main project directory.

**Steps to setup server locally**

1. Install npm
2. Install the requirements.
3. Start the development server.

**Installing npm**

``sudo apt-get update``

``sudo apt-get install nodejs``

``sudo apt-get install npm``

You have installed npm successfully. You can check the verison of npm with the command ``npm -v``

**Install the requirements.**

Now Inside the directory ``WikiContrib-Frontend``, type the command

``npm install``

This installs all the requirements to the tool.

**Start the development server.**

Now type the following command in the same directory.

``npm start``

This starts a development server in a URL alike ``http://localhost:3000/``. Hurray! you have successfully hosted the fronend in local environment.


You have successfully completed hosting the backend and frontend locally. You can visit the "Contributing" section to know how to contribute to the tool.
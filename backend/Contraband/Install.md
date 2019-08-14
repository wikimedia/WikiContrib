Now, if you type command `ls`, you can see a directory named **Contraband**. Go inside the directory using the command `cd Contraband.` There will be two directories in it:
1. backend
2. frontend

The present doc deals about installing and running `backend`. If you go inside `backend` directory( use command `cd backend`). You can find another directory named `Contraband`. It is the main project directory.

# Steps to setup server locally

1. Create a virtual environment.
2. Install the required packages to run the tool.
3. Create and Run the initial migrations.



## Creating a virtual environment:

Virtual environment isolates the entire project. The packages used by different projects will be different and few packages used in a project might not be compatible with another one. So, using virtual environment sets up packages individually to each project.

One way to create virtual environments in python is using [virtualenv tool](https://pypi.org/project/virtualenv/).


First Install python3, type the following commands inside `backend` directory 
```commandline
sudo apt-get install python3
```

Now you need to install pip3, it manages the python packages

```commandline
sudo apt-gt update
sudo apt-get install -y python3-pip
```

Let's Install virtualenv package.
```commandline
pip3 install virtualenv
```

you have successfully installed `virtualenv`. Noe let's create a virtual environment.
 ```commandline
virtualenv -p $(which python3) WMContraband
```

The above command creates a virtual environment named `VMContraband`. It creates a directory named `WMContraband` in the current directory. It is recommended to create  virtual environment in `backend` directory. You have successfully created the virtual environment. But you need to activate it now

To activate the virtual environment, type the following command (in the same directory where `WMContraband` is located):
```commandline
source WMContraband/bin/activate
```

Now go inside the `Contraband` directory (inside `backend`). Install all the packages that are required to run the project using the command.
```commandline
pip install -r requirements.txt
``` 

To check if `Django` is successfully installed. Type the following command:
```commandline
django-admin --version
```

The output is something like: `2.2.2`.

Before running the project, you need to provide an API key to fetch the details from the phabricator. So create a phabricator account from [here](https://phabricator.wikimedia.org/auth/start/?next=%2F). Use **Log In or Register** through Mediawiki(If you don't have a Mediawiki account, you can create it from [here](https://www.mediawiki.org/w/index.php?title=Special:CreateAccount)).

Once you login to thephabricator. You can generate a Conduit API token from `https://phabricator.wikimedia.org/settings/user/{Your username}/page/apitokens/` (fill your username in the link).

Copy the API token, and paste it in the variable named `API_TOKEN` in the file `backend/Contraband/contraband/settings.py`

Now, you need to run the migration files. Type the following command:
```commandline
python manage.py migrate
```

You have successfully created the schema now. Inorder to access the models you need to create a superuser. Use this command:
```commandline
python manage.py createsuperuser
```

The above prompts for username, email and password. The command creates a user with the corresponding username and password. You can see the database tables or models using it.

Finally, run the server with the command:
```commandline
python manage.py runserver
```

Hurray!! Now you can access the API. You can get the API doc [here](https://documenter.getpostman.com/view/6222710/SVYurxMj?version=latest).

To see the database tables, you can go to this url: `http://127.0.0.1:8000/admin/` and login with the above created credentials.
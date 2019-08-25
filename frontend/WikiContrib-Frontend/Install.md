Now, if you type command `ls`, you can see a directory named **WikiContrib**. Go inside the directory using the command `cd WikiContrib.` There will be two directories in it:
1. backend
2. frontend

The present doc deals about installing and running `frontend`. If you go inside `frontend` directory( use command `cd frontend`). You can find another directory named `WikiContrib-Frontend`. It is the main project directory.

## Steps to setup server locally

1. Install npm
2. Install the requirements.
3. Start the development server.

## Installing npm

```commandline
sudo apt-get update
sudo apt-get install nodejs
sudo apt-get install npm
```
You have installed npm successfully. You can check the verison of npm with the command `npm -v`

## Install the requirements.

Now Inside the directory `WikiContrib-Frontend`, type the command

```commandline
npm install
```

This installs all the requirements to the tool.

### Start the development server.

Now type the following command in the same directory.

```commandline
npm start
```

This starts a development server in a URL alike `http://localhost:3000/`. Hurray! you have successfully hosted the fronend in local environment.

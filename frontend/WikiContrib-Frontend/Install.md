Now, if you type command `ls` (for linux) or `dir` (for windows), you can see a directory named **WikiContrib**. Go inside the directory using the command `cd WikiContrib.` There will be two directories in it:
1. backend
2. frontend

The present doc deals with installing and running `frontend`. If you go inside `frontend` directory( use command `cd frontend`). You can find another directory named `WikiContrib-Frontend`. It is the main project directory.

## Steps to setup server locally

1. Install npm
2. Install the requirements.
3. Start the development server.

## Installing npm (Feel free to skip this step if you have node installed on your system)


**Linux**

```commandline
sudo apt-get update
sudo apt-get install nodejs
sudo apt-get install npm
```


**Windows**

1. go to https://nodejs.org/en/download/, go to the line "Windows Installer (.msi)" and download
 the necessary installer for your system (either 32-bit or 64-bit depending on your system bits)

2. go to the downloaded file, double click and follow the installer prompt to install nodejs

You can check the version of npm with the command `npm -v`


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

This starts a development server in a URL like `http://localhost:3000/`. Hurray! you have successfully hosted the frontend in your local environment.

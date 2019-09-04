# Create React app on toolforge.

## Steps to be followed:
1. create a tool on toolforge.
2. Add ```homepage``` to package.json
3. Update the routes in production.
4. generate a build file
5. upload to toolforge and configure ```lighttpd``` server.
6. start your webservice

## Create a tool on toolforge:

**Wikimedia** has a cloud service named **toolforge**. It is used to host the internal tools online.

To create a tool
1. you need to signup at https://tools.wmflabs.org/. 
2. Add the ssh keys (to link your computer).
3. Request access to create tools on toolforge with a proper reason.
4. Create a new tool.

You can find most of resources to create a tool here( https://wikitech.wikimedia.org/wiki/Help:Getting_Started)

## Add ```homepage``` to package.json

When you are hosting the project in a subdomain like: ```www.sample_domain.com/project/``` instead of a main domain (```www.sample_domain.com```) you need to tell the react app to load all the resources like (.css, .js, images, icons etc) to  from ```/project/static/---``` instead of ```/static/---```

So, you need to include a ```homepage``` in package.json file. Open your package.json file and include this line.
```json
"homepage": "/project"
```

## Updates the routes in production.

This can be a bit complicated task (to understand). In the previous section we only configured urls of the resources like css, js, images, icons etc to load from URL ```/project``` instead of ```/``` in production. But you might also have many routes and redirects declared in your app (using ```react-router-dom```). You need to update all the routes else, your app just returns a 404 page in prodcution.

In the page where you declared all the routes add a variable named **production**
Eg:
```js
export const production = false;

class App extends Component {
  state = {
    text: '/tool_name',
  };
  render() {
    let { text: t } = this.state;
    let domain = production ? t : '';
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path={domain + '/:hash/'} component={QueryResult} />
          <Route component={NotFound} />
        </Switch>
      </BrowserRouter>
    );
  }
}

export default App;
```

In the similar way to the example above, configure all the routes required. You also need to change the redirects. Suppose I have a redirect in some other file. You can change it using:

```js
import {production} from "./App"

 <Redirect
    to={{
      pathname: production ? "/tool_name/some_other_url" : "/some_other_url"
    }}
/>
```

In the similar way to the above redirect. Update all the places where the redirects are declaread. 

**Note:** The ```/tool_name``` is the name of the tool that you gave on toolforge.

## generate a build file

Hurray!! You have completed all the required configurations in the react app. It is now ready to generate a build file.

Run the following command in the directory where the ```pacakge.json``` and ```node_modules``` are present.

```commandline
npm run build
```

The above command generates a build directory in the current directory. You just need to host the build directory on toolforge now!

## upload to toolforge and configure `lighttpd` server.

Login to toolforge via SSH and create a new tool. Enter the environment of the tool using the command

```commandline
become tool_name
```
Now, create a folder named ```public_html```. All the inner contents of your build file has to be placed in this directory.

**Note:** Don't place ```build``` directory directly inside ```pulic_html```, only place all the inner contents of ```build``` directory.

## start your webservice
Finally, before starting the ```lighttpd``` server, create a file named ```.lighttpd.conf``` in ```~``` directory. Fill the file with the following contents:
```lighttpd
url.rewrite = (
    ".*\.(js|ico|gif|jpg|png|swf|css|woff|woff2|ttf)$" => "$0",
    "^" => "index.html",
)
```

The above does URL rewriting.  Whenever the client requests for a file ending with ```js|ico|gif|jpg|png|swf|css|woff|woff2|ttf```. The server returns the corresponding files. 

But if the client request any other URL. Only ```index.html``` file is being returned. This line prevents 404 error on refreshing the page.

Now you can start the service with the command: ```webservice lighttpd start```.

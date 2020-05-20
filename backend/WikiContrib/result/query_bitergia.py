from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
import os
import time
from datetime import datetime
import json

chrome_driver_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),"chromeDriver")
chrome_driver = os.path.join(chrome_driver_folder,os.listdir(chrome_driver_folder)[0])

chrome_options = Options()
chrome_options.add_argument("--headless");
chrome_options.add_argument('--disable-gpu');
chrome_options.add_argument("--proxy-server='direct://'");
chrome_options.add_argument("--proxy-bypass-list=*");

def query_bitergia(query,platform):

    driver = webdriver.Chrome(executable_path=chrome_driver, chrome_options=chrome_options)
    driver.set_script_timeout(500);
    driver.get("https://wikimedia.biterg.io/app/kibana#/dev_tools/console?_g=()")

    def _(by, elem):
        return WebDriverWait(driver, 100).until(EC.presence_of_element_located((by, elem)))

    get_to_console = _(By.CLASS_NAME, "kuiButton")
    get_to_console.click()

    print("executing ++++++++++++++++++++++++++++++++++")
    result =  driver.execute_async_script(
        """
        let isFirstQuery = true;
        let isEmpty = false;
        let scrollId = {"id":""};
        let total_result = [];

        let option = {data: arguments[0],
        contentType: "application/json",
        cache: !1,
    	crossDomain: !0,
    	type: "POST",
    	dataType: "text"};

        let scroll_option = "";

        console.log(option);
        console.log(arguments[1]);


        function sleep(ms){
        return new Promise(resolve=>setTimeout(resolve,ms));
        }

        async function Query(platform){
            while(!isEmpty){
                if(isFirstQuery){
                console.log("first query*******************************");
                let result = await jQuery.ajax(`https://wikimedia.biterg.io/api/console/proxy?path=/${platform}/_search?scroll=5m&method=POST`,option).then(function(a){
    			return a;
    			})

                result = JSON.parse(result);
                isFirstQuery = false;
                scrollId.id = result["_scroll_id"];
                if (result["hits"]["hits"].length > 0){
                    total_result.push(result["hits"]["hits"])
                    }
                else{isEmpty = true}

                }
                else{
                console.log("scroll query***************************");
                scroll_option = {
                    data:`{"scroll":"5m","scroll_id":"${scrollId.id}"}`,
                    contentType: "application/json",
                    cache: !1,
                    crossDomain: !0,
                    type: "POST",
                    dataType: "text"
                };

                let result = await jQuery.ajax('https://wikimedia.biterg.io/api/console/proxy?path=/_search/scroll/&method=POST',scroll_option).then(function(a,b,c){
    			return a;
    			})

                result = JSON.parse(result);
                scrollId.id = result["_scroll_id"];
                if (result["hits"]["hits"].length > 0){
                    console.log(result["hits"]["hits"][0]);
                    total_result.push(result["hits"]["hits"])
                    }
                else{isEmpty = true}

                }

            }
        }

        await Query(arguments[1]);
        total_result = total_result.flat();
    	arguments[arguments.length - 1](total_result);
    	"""
        ,query,platform)
    driver.quit()
    return result

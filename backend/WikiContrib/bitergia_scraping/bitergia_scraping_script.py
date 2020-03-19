import gzip
from json import load
from datetime import datetime
from seleniumwire import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


from seleniumwire.webdriver import chrome
from seleniumwire.webdriver import common
_By = common.by.By

import os

chrome_driver = os.getcwd() + "\chromedriver.exe"

chrome_options = chrome.options.Options()

query = ''

with open("query.json") as input:
    query = load(input)

driver = webdriver.Chrome(executable_path=chrome_driver, chrome_options=chrome_options,
                         seleniumwire_options={'verify_ssl': False})
driver.get("https://wikimedia.biterg.io/app/kibana#/dev_tools/console?_g=()")

def _(by, elem):
    return WebDriverWait(driver, 100).until(EC.presence_of_element_located((by, elem)))


get_to_console = _(_By.CLASS_NAME, "kuiButton")
get_to_console.click()

driver.execute_script("""
	ace.edit("editor").getSession().setValue(arguments[0]);
	document.querySelector(".editor_action").click();
	""",str(query))


request = driver.wait_for_request('https://wikimedia.biterg.io/api/console/proxy?path=_search&method=POST',timeout=30)
# print(request.response.__dict__)
# print(str(gzip.decompress(request.response.body),"utf-8"))
with open('bitergia_scraping-'+str(int(datetime.now().timestamp()))+'.json','w') as outfile:
            outfile.write(str(gzip.decompress(request.response.body),"utf-8"))
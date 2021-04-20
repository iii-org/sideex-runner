from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
import time

chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--headless')

driver = webdriver.Chrome(options=chrome_options)
driver.get("https://demo.iiidevops.org/")
time.sleep(5)
driver.save_screenshot('screenshot.png')
driver.close()

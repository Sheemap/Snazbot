# After I finished writing this code, Ive decided to rewrite it in Node JS as a normal snazbot module. I will use a snippet to detirmine if its run as the main module for weekly cronjob tasks.
# This way I can add dota commands into snazbot using the same module as the weekly function. It will also have direct safe access to the database.
# The rate limit logic will be the same, so it should be very easy to recreate

# Heres the snippet
# if(require.main === module){
# 	console.log('CODE RUNS HERE')
# }


import requests
import json
import time
import sys


class api:

	base_url = "https://api.opendota.com/api/"

	def __init__ (self):

		r = requests.get(self.base_url+'status')

		self.setRateLimit(r.headers)

		if r.status_code != 200:
			print("Not 200 response!\n",r.text)
			print(self.base_url+'status')
			sys.exit()


	def setRateLimit(self,headers):
		self.month_rate_limit = int(headers['x-rate-limit-remaining-month'])
		self.minute_rate_limit = [int(headers['x-rate-limit-remaining-minute']),time.time()]


	def checkRateLimit(self):

		if self.month_rate_limit < 50:
			print("Monthly rate limit reached!")
			raise Exception('Monthly rate limit reached')

		if (time.time() - self.minute_rate_limit[1]) >= 60:
			return [True]

		if self.minute_rate_limit[0] > 20:
			return [True]

		if self.minute_rate_limit == 0:
			print("Minute rate reached! Waiting full minute before calling.")
			return [False,60]

		if self.minute_rate_limit[0] <= 20:
			print("Minute rate limit close, waiting 3 seconds between calls.")
			return [False,3]



	def get (self,url):

		within_rate_limit = self.checkRateLimit()
		if not within_rate_limit[0]:
			time.sleep(within_rate_limit[1])

		r = requests.get(self.base_url+url)

		self.setRateLimit(r.headers)

		if r.status_code != 200:
			print("Not 200 response!\n",r.text)
			print(self.base_url+url)
			return False

		payload = json.loads(r.text)
		return payload

		





test = api()
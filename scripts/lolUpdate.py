# Uses cassiopeia for league API access (much much easier than the node implementations of it)
# pip3 install cassiopeia

import cassiopeia as cass
import configparser
import sys
import sqlite3
import json
import datetime

today = datetime.datetime.now()
start_delta = datetime.timedelta(weeks=1)
last_week = int((today - start_delta).timestamp())*1000
print(last_week)

conn = sqlite3.connect('../data/data.db')
c = conn.cursor()

config = configparser.ConfigParser()
config.read('../config/config.ini')

cass.apply_settings('../config/cass.json')

cass.set_riot_api_key(config['league']['key'])
cass.set_default_region("NA")

def main():
	if len(sys.argv) == 1:
		print('Requires more arguments')
		return
	else:
		summoner_name = " ".join(sys.argv[1:]).lower()

		if len(summoner_name) > 16:
			print('Summoner name is too long!')
			return

		summoner = cass.get_summoner(name=summoner_name)
		# test = cass.get_summoner(name="ScroobleDooble")
		history = summoner.match_history

		print(history[0])


def listAvg(data,rounding):
	count = len(data)
	total = 0
	for l in data:
		total += int(l)

	if rounding:
		return round(total/count,2)
	else:
		return total/count


def wotw():
	win_string = ''
	scores = {}
	for row in c.execute('SELECT * FROM league'):
		print(row[3])
		summoner = cass.Summoner(id=json.loads(row[3])['id'])

		history = summoner.match_history(begin_time=last_week)

		games_played = len(history)
		if games_played <= 0:
			continue

		# print(scores[row[1]])
		if row[1] in scores:
			scores[row[1]]['count'] += games_played
		else:
			scores[row[1]] = {}
			scores[row[1]]['count'] = games_played
			scores[row[1]]['agold'] = []
			scores[row[1]]['adamage'] = []
			scores[row[1]]['acs'] = []
			scores[row[1]]['akills'] = []
			scores[row[1]]['aassists'] = []
			scores[row[1]]['adeaths'] = []

		gold = []
		damage = []
		cs = []
		kills = []
		assists = []
		deaths = []

		agold = 0
		adamage = 0
		acs = 0
		akills = 0
		aassists = 0
		adeaths = 0



		for match in history:

			minutes = 0
			duration = str(match.duration).split(':')
			minutes += int(duration[0])*60
			minutes += int(duration[1])
			minutes += round(int(duration[2])/60)

			for p in match.participants:
				if p.summoner == summoner:
					gold.append(p.stats.gold_earned)
					damage.append(p.stats.total_damage_dealt_to_champions)
					cs.append(p.stats.total_minions_killed)
					kills.append(p.stats.kills)
					assists.append(p.stats.assists)
					deaths.append(p.stats.deaths)

		scores[row[1]]['agold'].append(listAvg(gold,False))
		scores[row[1]]['adamage'].append(listAvg(damage,False))
		scores[row[1]]['acs'].append(listAvg(cs,False))
		scores[row[1]]['akills'].append(listAvg(kills,False))
		scores[row[1]]['aassists'].append(listAvg(assists,False))
		scores[row[1]]['adeaths'].append(listAvg(deaths,False))


	# TODO: Average scores from summoners per person, then detirmine winners then build and send the win_string




if __name__ == "__main__":
	# main()
	wotw()
# Uses cassiopeia for league API access (much much easier than the node implementations of it)
# pip3 install cassiopeia

import cassiopeia as cass
import configparser
import sys
import sqlite3
import json
import datetime
import discord
import asyncio
from random import randint

adj_list = ['an awesome','a fantastic','a delicious','a delightful','a scrumptious','a boolin','a sick','a rad','a tubular','a cool','a nice','a super','a neato','an okayish','an alright','a fine','a decent','a mediocre','a chill','an amazing']

today = datetime.datetime.now()
start_delta = datetime.timedelta(weeks=1)
last_week = int((today - start_delta).timestamp())*1000

client = discord.Client()

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

def randomAdjective():
	index = randint(0,len(adj_list)-1)
	return adj_list.pop(index)


async def wotw(send_award):
	win_string = ''
	scores = {}
	for row in c.execute('SELECT * FROM league'):
		print(row[3].encode('utf-8'))

		summ_id = json.loads(row[3])['id']
		summoner = cass.Summoner(id=summ_id)

		history = summoner.match_history(begin_time=last_week,queues=['NORMAL_5V5_BLIND_PICK','RANKED_FLEX_SR','RANKED_SOLO_5x5','TEAM_BUILDER_DRAFT_UNRANKED_5x5'])

		games_played = len(history)
		if games_played <= 0:
			continue

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
			scores[row[1]]['avision'] = []

		# gold = []
		# damage = []
		# cs = []
		# kills = []
		# assists = []
		# deaths = []


		for match in history:

			minutes = 0
			duration = str(match.duration).split(':')
			minutes += int(duration[0])*60
			minutes += int(duration[1])
			minutes += round(int(duration[2])/60)

			# print(minutes)
			# print(match.queue)

			if minutes <= 10:
				scores[row[1]]['count'] += -1
				continue

			for p in match.participants:
				if p.summoner.account_id == "0":
					continue

				if p.summoner == summoner:
					scores[row[1]]['agold'].append(p.stats.gold_earned)
					scores[row[1]]['adamage'].append(p.stats.total_damage_dealt_to_champions)
					scores[row[1]]['acs'].append(p.stats.total_minions_killed)
					scores[row[1]]['akills'].append(p.stats.kills)
					scores[row[1]]['aassists'].append(p.stats.assists)
					scores[row[1]]['adeaths'].append(p.stats.deaths)
					scores[row[1]]['avision'].append(p.stats.vision_score)

		# scores[row[1]]['agold'].append(listAvg(gold,False))
		# scores[row[1]]['adamage'].append(listAvg(damage,False))
		# scores[row[1]]['acs'].append(listAvg(cs,False))
		# scores[row[1]]['akills'].append(listAvg(kills,False))
		# scores[row[1]]['aassists'].append(listAvg(assists,False))
		# scores[row[1]]['adeaths'].append(listAvg(deaths,False))


	# TODO: Average scores from summoners per person, then detirmine winners then build and send the win_string

	for user in scores:
		scores[user]['agold'] = listAvg(scores[user]['agold'],True)
		scores[user]['adamage'] = listAvg(scores[user]['adamage'],True)
		scores[user]['acs'] = listAvg(scores[user]['acs'],True)
		scores[user]['akills'] = listAvg(scores[user]['akills'],True)
		scores[user]['aassists'] = listAvg(scores[user]['aassists'],True)
		scores[user]['adeaths'] = listAvg(scores[user]['adeaths'],True)
		scores[user]['avision'] = listAvg(scores[user]['avision'],True)

	top_gold = [0,0]
	top_damage = [0,0]
	top_cs = [0,0]
	top_kills = [0,0]
	top_assists = [0,0]
	top_deaths = [0,0]
	top_vision = [0,0]

	for user in scores:
		if scores[user]['count'] < 4:
			continue
		if scores[user]['agold'] > top_gold[0]:
			top_gold[0] = scores[user]['agold']
			top_gold[1] = user

		if scores[user]['adamage'] > top_damage[0]:
			top_damage[0] = scores[user]['adamage']
			top_damage[1] = user

		if scores[user]['acs'] > top_cs[0]:
			top_cs[0] = scores[user]['acs']
			top_cs[1] = user

		if scores[user]['akills'] > top_kills[0]:
			top_kills[0] = scores[user]['akills']
			top_kills[1] = user

		if scores[user]['aassists'] > top_assists[0]:
			top_assists[0] = scores[user]['aassists']
			top_assists[1] = user

		if scores[user]['adeaths'] > top_deaths[0]:
			top_deaths[0] = scores[user]['adeaths']
			top_deaths[1] = user

		if scores[user]['avision'] > top_vision[0]:
			top_vision[0] = scores[user]['avision']
			top_vision[1] = user

	win_string = "**This weeks winners are in!**\n\n"\
					"First up comes the midas award, smelted by <@{gold_user}>! On average they snatched {adj1} **{gold_top}** gold per game!\n\n"\
					"Next we have the bruiser award, smashed by <@{damage_user}>! On average they dished out {adj2} **{damage_top}** damage each match!\n\n"\
					"Third is the humble farmer, reaped by <@{cs_user}>! On average they harvested {adj3} **{cs_top}** minions per game!\n\n"\
					"Next award is the serial killer, slaughtered by <@{kills_user}>! On average they murdered {adj4} **{kills_top}** champions in cold blood!\n\n"\
					"The accomplice is the next award, slurped by <@{assists_user}>! On average they claimed {adj5} **{assists_top}** assists per game!\n\n"\
					"Next we have the omnipotent award, sighted by <@{vision_user}>! On average they had {adj6} **{vision_top}** vision score per match!\n\n"\
					"Finally, we have the feeder of the week. Inted by <@{deaths_user}>. On average they fed {adj7} **{deaths_top}** deaths per game. Shame them.".format(gold_user=top_gold[1],
																																									gold_top=top_gold[0],
																																									damage_user=top_damage[1],
																																									damage_top=top_damage[0],
																																									cs_user=top_cs[1],
																																									cs_top=top_cs[0],
																																									kills_user=top_kills[1],
																																									kills_top=top_kills[0],
																																									assists_user=top_assists[1],
																																									assists_top=top_assists[0],
																																									deaths_user=top_deaths[1],
																																									deaths_top=top_deaths[0],
																																									vision_user=top_vision[1],
																																									vision_top=top_vision[0],
																																									adj1=randomAdjective(),adj2=randomAdjective(),adj3=randomAdjective(),adj4=randomAdjective(),adj5=randomAdjective(),adj6=randomAdjective(),adj7=randomAdjective())


	if send_award:
		channel = client.get_channel(int(config['league']['channel']))
		await channel.send(win_string)
	else:
		print("Recieved command argument. Not sending discord message.")




	print(win_string)
	print(scores)



# @client.event
# async def on_ready():
# 	client.send_message(client.get_channel(config['league']['channel']), 'Calculating messages...')

@client.event
async def on_ready():
	print('Ready!')
	if len(sys.argv) > 1:
		await wotw(False)
	else:
		await wotw(True)
	client.logout()
	sys.exit()


if __name__ == "__main__":
	# main()
	client.run(config['general']['token'])
	# wotw()


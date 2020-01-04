import sys
import sqlite3
import time
import json

conn = sqlite3.connect('../data/data.db')
c = conn.cursor()

conn2 = sqlite3.connect('../data/old-data.db')
c2 = conn2.cursor()

c.execute('INSERT OR REPLACE INTO Server VALUES (1, 104981147770990592, \'Snazcat\')')

users = {}
chungusUsers = {}
memes = {}

def unixTime():
    return int(time.time())

def getOrInsertUserId(disId, disNam):
    if not disId in users:
        c.execute('INSERT INTO User VALUES (null, ?, ?, ?, 1)', (disId, disNam, disNam))
        users[disId] = c.lastrowid
        return c.lastrowid
    else:
        return users[disId]

def insertMeme(userId, url, votes):
    if not url in memes:
        c.execute('INSERT INTO Meme VALUES (null, ?, ?, ?)', (url, userId, unixTime()))
        memeId = c.lastrowid
        memes[url] = memeId

        baseVotes = votes - 5
        if baseVotes < 0:
            for i in range(baseVotes * -1):
                c.execute('INSERT INTO MemeVote VALUES (null, ?, ?, ?, ?, 0)', (memeId, 0, 0, unixTime()))
        else:
            for i in range(baseVotes):
                c.execute('INSERT INTO MemeVote VALUES (null, ?, ?, ?, ?, 0)', (memeId, 1, 0, unixTime()))

def insertChungusUser(userId, color, name):
    if not userId in chungusUsers:
        c.execute('INSERT INTO Chungus VALUES (null, ?, ?, ?, ?)', (userId, unixTime(), color, name))
        chungusUsers[userId] = c.lastrowid
        return c.lastrowid
    else:
        return chungusUsers[userId]

def insertChungusTime(userId, timestamp):
    c.execute('INSERT INTO ChungusPoints VALUES (null, 0, 0, 1, ?, ?)', (userId, timestamp))

def insertChungusPoints(userId, points, timestamp):
    c.execute('INSERT INTO ChungusPoints VALUES (null, ?, 0, 1, ?, ?)', (points, userId, timestamp))

def main():
    c2.execute('SELECT * FROM memes')
    for row in c2.fetchall():
        userId = getOrInsertUserId(row[1], row[0])
        insertMeme(userId, row[3], row[4])

    conn.commit()

    chungus_leaders = []
    total_seconds = 0
    current_chungus_userId = 0
    current_chungus_duration = 0
    c2.execute('SELECT * FROM data')
    for row in c2.fetchall():
        jsonData = json.loads(row[2])
        if "seconds_as_chungus" in jsonData:
            userId = getOrInsertUserId(row[1], row[0])
            insertChungusUser(userId, jsonData.get("chungus_color", "null"), jsonData.get("chungus_name", "null"))
            total_seconds += sum(jsonData["seconds_as_chungus"])

            if jsonData.get("chungus_since", "false") == "false":
                chungus_leaders.insert(0, { userId : jsonData["seconds_as_chungus"] })
            else:
                chungus_leaders.append({ userId : jsonData["seconds_as_chungus"] })
                current_chungus_duration = unixTime() - jsonData["chungus_since"]
                current_chungus_userId = userId
    
    insertDate = unixTime() - current_chungus_duration

    insertChungusTime(current_chungus_userId, insertDate)

    insertDate -= current_chungus_duration
    
    while len(chungus_leaders) > 0:
        for cdict in chungus_leaders:
            for userId in cdict:
                if(len(cdict[userId]) == 0):
                    chungus_leaders.pop(chungus_leaders.index(cdict))
                    continue

                time = cdict[userId][0]
                insertChungusTime(userId, insertDate)
                insertDate -= time
                cdict[userId].pop(0)
                

    conn.commit()

    c2.execute('SELECT * FROM chungus')
    for row in c2.fetchall():
        userId = getOrInsertUserId(row[1], row[0])
        insertChungusUser(userId, "null", "null")
        insertChungusPoints(userId, row[3], insertDate)

    conn.commit()
    



if __name__ == '__main__':
    main()
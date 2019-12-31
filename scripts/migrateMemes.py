import sys
import sqlite3
import time

conn = sqlite3.connect('../data/data.db')
c = conn.cursor()

conn2 = sqlite3.connect('../data/old-data.db')
c2 = conn2.cursor()

c.execute('INSERT OR REPLACE INTO Server VALUES (1, 104981147770990592, \'Snazcat\')')

users = {}
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

def main():
    c2.execute('SELECT * FROM memes')
    for row in c2.fetchall():
        userId = getOrInsertUserId(row[1], row[0])
        insertMeme(userId, row[3], row[4])

    conn.commit()

if __name__ == '__main__':
    main()
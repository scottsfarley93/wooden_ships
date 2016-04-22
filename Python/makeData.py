import psycopg2
import csv
def connectToDatabase(hostname, username, password, database):
    try:
        connectString = "dbname='" + str(database) + "' user='" + str(username) + "' host='" + str(hostname) + "' password='" + str(password) + "'"
        conn = psycopg2.connect(connectString)
        return conn
    except:
        print "I am unable to connect to the database"
        return False

def closeConnection(connection):
    try:
        connection.close()
        return True
    except:
        print "Failed to close connection."
        return False

print "Started."
remoteConn = connectToDatabase("144.92.235.47", "scottsfarley", "xP73m3YAb1", "wooden_ships")
if not remoteConn:
    print "Failed to connect to remote resource."
    exit()
print "Connected."

out = open("/users/scottsfarley/documents/wooden_ships/main/assets/data/ship_lookup.csv", 'w')
writer = csv.writer(out, lineterminator="\n")
header = []

#header = ["locationID", "locationID", "Latitude", "Longitude", "obsDate", "voyageID", "memoType", "memoText"]
# sql = "SELECT locations.locationid, locations.latitude, locations.longitude, locations.date, locations.voyageID, weather.snow, " \
#       "weather.airtemp, weather.pressure, weather.sst, weather.winddirection, weather.windforce, weather.gusts, weather.rain, weather.fog, weather.thunder, weather.hail, weather.seaice " \
#       "from weather " \
#       "inner join locations on locations.locationid = weather.locationid " \
#       "inner join voyages on voyages.voyageid = locations.voyageid " \
#       "inner join nations on nations.nationid = voyages.nationid " \
#       "where nations.nationality = 'French';"
# print sql

# sql = "SELECT portname, latitude, longitude, modernName from voyages inner join ports on voyages.fromPlace = ports.portname WHERE latitude is NOT NULL and longitude is not null; SELECT portname, latitude, longitude, modernname from voyages " \
#       "inner join ports on voyages.toPlace=ports.portname where latitude is not null and longitude is not null;"

# header = ["observationID", "locationID", "Latitude", "Longitude", "obsDate", "voyageID", "memoType", "memoText"]
# sql = "SELECT obsid, locations.locationid, locations.latitude, locations.longitude, locations.date, locations.voyageid, memoType, memoText  " \
#       "FROM observations " \
#       "INNER JOIN locations on locations.locationid=observations.locationid " \
#       "INNER JOIN voyages on voyages.voyageid=locations.voyageid " \
#       "INNER JOIN nations on nations.nationid=voyages.nationid " \
#       "WHERE memoType !='recordID' AND memoType != 'obsLanguage' AND nations.nationality='British' " \
#       "" \
#       ";"
#
#
# #
# #
header = ["voyageID", "captainName", "rank", "fromPlace", "toPlace", "voyageStartDate", "nationality", "shipName", "shipType", "companyName"]
sql = "SELECT voyages.voyageID, captains.captainName, rank, voyages.fromPlace, voyages.toPlace, voyages.startdate, nations.nationality, ships.shipName," \
      "ships.shipType, companies.companyName from voyages " \
      "INNER JOIN ships on ships.shipid=voyages.shipid " \
      "INNER JOIN companies on companies.companyid=voyages.companyid " \
      "INNER JOIN nations on nations.nationid=voyages.nationid " \
      "INNER JOIN captains on captains.captainid=voyages.captainid ;"

writer.writerow(header)

cursor = remoteConn.cursor()
cursor.execute(sql)
rows = cursor.fetchall()
i = 0
for row in rows:
    writer.writerow(list(row))
    if i % 100 == 0:
        print i
    i += 1
print i

out.close()
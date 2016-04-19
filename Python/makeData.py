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

out = open("/users/scottsfarley/documents/wooden_ships/data/french_points.csv", 'w')
writer = csv.writer(out, lineterminator="\n")
header = ["locationID", "latitude", "longitude", "date", "voyageID", "snow", "airTemp", "pressure", "winddirection", "windSpeed", "gusts", "rain", "fog", "thunder", "hail", "seaIce"]
writer.writerow(header)

sql = "SELECT locations.locationid, locations.latitude, locations.longitude, locations.date, locations.voyageID, weather.snow, " \
      "weather.airtemp, weather.pressure, weather.sst, weather.winddirection, weather.windforce, weather.gusts, weather.rain, weather.fog, weather.thunder, weather.hail, weather.seaice " \
      "from weather " \
      "inner join locations on locations.locationid = weather.locationid " \
      "inner join voyages on voyages.voyageid = locations.voyageid " \
      "inner join nations on nations.nationid = voyages.nationid " \
      "where nations.nationality = 'French';"
print sql
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
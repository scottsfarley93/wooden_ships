#Database and API
####Updated March 19, 2016

##Basic
The API and underlying database is a way that we can access the data with dynamic queries from our javascript programs.  I am not sure that it will work on the geography server, so we have to chack.  In any case, it will be much easier to query for interesting stories with this technique than through an excel sheet.  Here are instructions on using the API, though it will probably be easier to touch base with you all via skype.

## Setting up the database
Follow the instructions I sent by email.  Let me know if that does not work, we can try to debug.  Once you have the database, you can query in sql via the command line psql app or via the PGAdmin GUI app.  I've canned some routines that will be helpful (see below), but if you want more flexibility, this is for you.

##Using the API
####Starting the server
The API must be run on a localhost server.  We will use a server written in python called CherryPy which is pretty versatile and easy to program in. Follow these steps for getting it running:  

	1.  Install cherrrypy with the command line.  You should all have pip (python package manager) on your macs.  If you don't have pip, you can install it separately.
	```sudo pip install cherrypy```  


	Enter your password, and it should install for you
	2.  Start the server: open a command prompt and navigate to the data folder of the project directory using cd.  Type:   

	>python serve_data.py
	
	You should see the prompt spit out a bunch of checks and then a message saying BUS STARTED.  You're good to go.
	
####Using the API
Open a web browser and nagivate to localhost:8080/api  Then you can query the methods outlined below.  Basically, you type in a method name (like 'data') and then a '?' and then a list of parameters and values (param1=value1) separated by '&'. There are good google resources that can explain rest apis if you're not familiar.


I've configured the following routines to run through the API:  

#####Data
Allows flexible querying of all of the database fields and by time and space.  You can limit the fields to the ones you want by adding a fieldlist=field1,field2,...,fieldn parameter.  You probably want to set header to true, so that your response will include field names as a json object.  Below is a list of all of the possible parameters.  If you're not interested in a parameter, don't include it.

Fields:

```
	header=False, logbookLanguage = "", voyageFrom = "", voyageTo = "", shipName = "", shipType = "", company = "", nationality = "", name1= "", year = "", month = "", day = "", lat = "", lng = "", obsGen = False, cargo = False, biology=False,
            warsAndFights=False, otherObs=False, illustrations=False, shipsAndRig=False, lifeOnBoard=False,
            anchored = False, windDirection = "", windForce="", weather="", shapeClouds= "", dirClouds="", clearness="",
            precipitationDescriptor="", gusts=False, rain=False, fog=False, snow=False, thunder=False, hail=False, seaice=False,
            minYear="", maxYear="", minMonth="", maxMonth="", minDay="", maxDay="", latN="", latS = "", lngE="", lngW="", weatherCodeNotNull=False,
            fieldlist="")
            
```
            
Examples:
>> http://localhost:8080/api/data?nationality=British&header=True&weatherCodeNotNull=True&fieldlist=weather,lat3,lon3,winddirection,windforce,shipname


Returns all of the British records with a weather description but only shows the weather, latitude, longitude, windforce, and shipname fields.

>> http://localhost:8080/api/data?minYear=1755&maxYear=1756&nationality=Dutch

Returns all of the the records for Dutch ships between 1756 and 1756 as arrays (no field names)

#####Voyages
Allows structured querying of different voyages.  A voyage is characterized as having a single ship, nationality, and start and end points.  The fields returned are set.  You will only get unique voyages.  You can limit your response to only include records with the specified nationality, shiptype, company, captain, and min and max years. Headers are automatic.

Fields:

```company="", nationality="", captain="", shiptype= "", minYear="", maxYear=""```

Examples:

>> http://localhost:8080/api/voyages?minYear=1750&maxYear=1800&nationality=French

Get all of the different voyages by french ships between 1750 and 1800


>> http://localhost:8080/api/voyages?company=EIC

Get all of the different voyages made by ships operated by the Dutch East India Company

#####Ships
Allows structures voyages of the different ships contained within the database.   One ship can make multiple voyages.  Filtering is similar to the Voyage API.  Headers are automatic.

Fields:

```company="", nationality="", captain="", shiptype= "", minYear="", maxYear=""```

Examples:


>> http://localhost:8080/api/ships?company=EIC

Returns all of the ship names operated by the dutch East India Company.

>> http://localhost:8080/api/ships?nationality=Spanish

Returns all of the Spanish ships in the database.

#####Captains
Allows structured querying of the captains commanding the ships.  One captain can have multiple voyages or command multiple ships.  Headers are automatic

Fields:  

```name="", rank="", shipname="", company="", nationality="", shiptype="", minYear="", maxYear=""```

Examples:

>> http://localhost:8080/api/captains?nationality=Hamburg

Returns the names of all of the Hamburg captains.

>> http://localhost:8080/api/captains?minYear=1845

Returns the names of all of the captains in operation after 1845

####Companies
Allows structured querying of the companies operating the ships.  Headers are automatic. 

Fields:

```company="", nationality="", minYear="", maxYear=""```

Examples:

>> http://localhost:8080/api/companies?minYear=1830

Get all of the companies operating after 1830

>> http://localhost:8080/api/companies?nationality=French

Get all of the french companies in operation during the 1750-1850 period.

#####Nations
Get a list of all of the nationalities operating.

Fields:

```minYear="", maxYear=""```


>> http://localhost:8080/api/nations

List all of the nationalities in the database.

#####Locations
Returns a locational position in space and time for a query. Useful for leaflet/d3 maps where you don't want all of the extra data, just the position. Query by space (lat/lng) or time min/max years,months, days.

Fields:

```
minYear="", maxYear="", minMonth="", maxMonth="", minDay="", maxDay="",
            nationality="", company="", shipname="", latN="", latS="", lngE="", lngW=""
```

Examples:

>> http://localhost:8080/api/locations?minYear=1825&maxYear=1825&minMonth=12&maxMonth=12&nationality=Dutch


Show where all of the Dutch ships were in December of 1825.

#####Details

List all of the record information for a single logbook observation.  Useful if you used the location method previously, and now you want more information about a specific record.  Only parameter is recordID.  Headers are not included.

Example:

>> http://localhost:8080/api/details?recordID=108975

List all of the fields for record #108975


I apologize for the formatting here.  I'm at the airport -- will update ASAP.



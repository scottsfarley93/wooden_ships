///this is Wooden Ships Main Javascript File
//All functions are here

var attrArray = ["countries_1715", "countries_1783", "countries_1815"];

var expressed = attrArray[0]

var attrProj = ["VDG", "Mercator", "sat"]; // list of projections

globals = {}
globals.basemap = {}
globals.map = {}
globals.map.dimensions ={};
globals.map.dimensions.height = $(window).height() * 0.9; //90% of the window height
globals.map.dimensions.width = $(window).width() //100% of the window width
globals.map.projection;
globals.map.path;

globals.data = {};
globals.data.filteredShips = []; //keep track of the currently applied filter

globals.map.hexRadius = 1;

scale0 = (globals.map.dimensions.width - 1) / 2 / Math.PI;

globals.filter = {} //keep track of the currently applied filter

var radius = d3.scale.sqrt()
    .domain([0, 12])
    .range([0, 8]);

var expressedProj = attrProj[0];


//this should be replaced with a better coloring func
var color = d3.scale.linear()
    .domain([0, 1000])
    .range(["green","darkred"])
    .interpolate(d3.interpolateLab);
    
parseDate = d3.time.format("%x").parse;

var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([1, 12])
    .on("zoom", zoomed);
    


//change the stacking order of d3 elements
// https://github.com/wbkd/d3-extended
d3.selection.prototype.moveToFront = function() {  
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};
d3.selection.prototype.moveToBack = function() {  
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    });
};



$(document).ready(function(){
	//stuff that happens as the map is created.
	setMap(); //creates the map
	changeCountry("British")
	loadShipLookup() // get metadata about ships and voyages and captains
})


//set up map and call data
function setMap(){	        
	    //use queue.js to parallelize asynchronous data loading
	    d3_queue.queue()
	        .defer(d3.json, "assets/data/land.topojson") //load base map data
	        .await(callback);
	        
		function callback(error, base, overlay1, overlay2, overlay3){
			//happens once the ajax have returned
	        	    //create new svg container for the map
	    globals.map.mapContainer = mapContainer = d3.select("#map")
	        .append("svg")
	        .attr("class", "mapContainer")
	        .attr("width", globals.map.dimensions.width)
	        .attr("height",  globals.map.dimensions.width);
	        
	        
	    globals.map.features = globals.map.mapContainer.append("g"); //this facilitates the zoom overlay

		globals.map.features.append("rect")//this is the zoom overlay -->THIS IS WHERE THE PROBLEM IS --> LAYER STACK IS AN ISSUE
		    .attr("class", "overlay")
		    .attr("width", globals.map.dimensions.width)
		    .attr("height", globals.map.dimensions.height)
		    .call(zoom).call(zoom.event)
		    //.moveToBack(); //call the zoom on this element
		    
		    
	        //translate europe TopoJSON
	        var landBase = topojson.feature(base, base.objects.ne_110m_land).features
	         
	         
	      //create the hexbin layout
	      globals.map.hexbin = d3.hexbin()
	    	.size([globals.map.dimensions.width, globals.map.dimensions.height])
	    	.radius(2.5)
	    	.x(function(d){
	    		return d.projected[0]
	    	})
	    	.y(function(d){
	    		return d.projected[1]
	    	})
	         
	         globals.land = globals.map.features.selectAll(".land")
	            .data(landBase)
	            .enter()
	            .append("path")
	            .attr("class", "land")
	            //.style("stroke", "black").style("fill", "blue"); 
	         
	         changeProjection("Mercator");
	}; //end of callback
};//end of set map

function zoomed() {
	evt = d3.event
	globals.map.features.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	//additional hex styling can go here
};
	
	
	
	
//function to create a dropdown menu for attribute selection
function projDropdown(attrProj){
    //add select element
    var dropdownProjections = d3.select("#controls")
        .append("select")
        .attr("class", "dropdownProjections")
        .on("change", function(){
            if (this.value == "Mercator"){
            	changeProjection("mercator")
            }else if (this.value == "VDG"){
            	changeProjection("VDG");
            }else if(this.value == "sat"){
            	changeProjection("sat")
            }
        });

    //add initial option
    var titleOption = dropdownProjections.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Projection");

    //add attribute name options
    var projOptions = dropdownProjections.selectAll("projOptions")
        .data(attrProj)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};
		

		 

//dropdown change listener handler
function changeProjection(projection, scale, center){
    //decide what projection to change to
    if (projection == "VDG") {
    	var projection = d3.geo.vanDerGrinten4()
    		.scale(125)
   	 		.translate([globals.map.dimensions.width / 2, globals.map.dimensions.height / 2])
    		.precision(.1);
    }
    else if (projection == "Mercator"){
    	var projection = d3.geo.mercator()
    		.scale((globals.map.dimensions.width + 1) / 2 / Math.PI)
    		.translate([globals.map.dimensions.width  / 2, globals.map.dimensions.height / 2])
    		.precision(.1);

    }else if (projection == "sat"){
		var projection = d3.geo.satellite()
		    .distance(1.1)
		    .scale(5500)
		    .rotate([76.00, -34.50, 32.12])
		    .center([-120, 37])
		    .tilt(25)
		    .clipAngle(Math.acos(1 / 1.1) * 180 / Math.PI - 1e-6)
		    .precision(.1);
    }else{
    	console.log("Projection not supported.")
    	return
    }
   var path = d3.geo.path()
    .projection(projection);
   //make global
   globals.map.projection = projection;
   globals.map.path = path;
   //do the update
   globals.land.transition().attr('d', path) //this causes an invalid path????
   
   //update the hexagons
   changeHexSize(globals.map.hexRadius)
};


function getShipData(filename, callback){
	d3.csv(filename, function(data){
		_.each(data, function(d){
			d.airTemp = +d.airTemp;
			d.pressure = +d.pressure
			d.sst = +d.sst
			d.winddirection = +d.winddirection;
			d.windSpeed = +d.windSpeed;
			d.latitude = +d.latitude;
			d.longitude = +d.longitude;
			d.date = new Date(d.date)
		})
		globals.data.ships = data //so we can revert later
		globals.data.filteredShips = data //keep track of the most recent filtered data
		if (callback){
			callback(data)
		}
	})
}

function displayShipDataHexes(datasetArray){
	//format a data array of ship data and display it on the map as hexbins
	datasetArray.forEach(function(d){
		var p = globals.map.projection([d['longitude'], d['latitude']])
		d['projected'] = p
		//d.date = parseDate(d.date);
	})
	 globals.map.hexagons = globals.map.features.append("g")
      .attr("class", "hexagons")
    .selectAll(".hexagons")
      .data(globals.map.hexbin(datasetArray))
    .enter().append("path")
    	.attr('class', 'hexagon')
      .attr("d", globals.map.hexbin.hexagon())
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .style("fill", function(d) { return color(d3.median(d, function(d) { return +d.date; })); })
      //.attr("fill", 'green')
      .attr('stroke', 'orange')
      .style('stroke-width', 0.25)
      .on('click', function(d){
      	memos = filterToHexBin(globals.data.memos, d)
      	console.log(memos)
      })
      .on('mouseover', function(d){
      	d3.select(this).moveToFront()
      	d3.select(this).style({'stroke': 'white', "stroke-width": 1})
      	memos = filterToHexBin(globals.data.memos, d)
      	displayMemos(memos)
      })
      .on('mouseout', function(d){
      	d3.select(this).style({'stroke': 'orange', 'stroke-width' : 0.25})
      })
      //put the countries in front of the hexagons
      globals.land.moveToFront();
}

function getPorts(filter, callback){        
	  d3_queue.queue()
	  	.defer(d3.json, "http://grad.geography.wisc.edu/sfarley2/voyageStarts.php", {geocode: true, modernName: true})
	  	.defer(d3.json, "http://grad.geography.wisc.edu/sfarley2/voyageStarts.php", {geocode: true, modernName: true})
	  	.await(uniquePorts)
}

function uniquePorts(){
	//combine the two parts arrays so that we have only one array of geocoded ports
	bigArray = globals.data.voyageStarts.concat(voyage.data.voyageEnds);
	globals.data.ports = _.uniq(bigArray, function(d){
		return d.place;
	})
}

function getLogbookRecord(locationID, callback){
	$.ajax("http://grad.geography.wisc.edu/sfarley2/data.php",{
		beforeSend: function(){
			console.log("Getting logbook data from: " + this.url)
		},
		data: {
			locationID: locationID
		},
		dataType:"jsonp",
		success: function(response){
			console.log(response['data'][0]);
			if(callback){
				callback(response);
			}
			changeHexSize(globals.map.hexRadius)
		},
		
		error: function(xhr, status, error){
			console.log("ERROR: " + error)
		}
	})
}

function removeHexes(){
	d3.selectAll(".hexagons").transition(100).remove()
}

function changeHexSize(radius){
	//remove all previous hexes
	console.log("changed hex size")
	removeHexes();
	globals.map.hexbin.radius(radius);
	displayShipDataHexes(globals.data.filteredShips)//with the most recent filter applied
}


//initialize hex bin slider
$( "#hexSlider" ).slider({
	min: 1,
	max: 50,
	value: 2,
	step: 0.5,
	change: function(evt, ui){
		newRadius = ui.value
		globals.map.hexRadius = newRadius;
		changeHexSize(newRadius)
	}
});
//control hex bin size

function processMemos(memos){
	_.each(memos, function(d){
		d['Latitude'] = Number(d['Latitude'])
		d['Longitude'] = Number(d['Longitude'])
		q = d['obsDate']
		d['date'] = new Date(q)
	})
	globals.data.memos = memos
	console.log("Done loading memos")
}

function changeCountry(countryName){
	//changes the map interface to reflect a new country's data.  Options are 'Dutch', 'French', 'British', 'Spanish'
	//load in new data
	
	
	if (countryName == "British"){
		f = "/assets/data/british_points.csv"
		d3.csv("/assets/data/british_memos_update.csv", function(data){
			processMemos(data)
		})
	}
	else if (countryName == "Dutch"){
		f = "/assets/data/dutch_points.csv"
		d3.csv("/assets/data/dutch_memos_update.csv", function(data){
			processMemos(data)
		})
	}
	else if (countryName == "Spanish"){
		f = "/assets/data/spanish_points.csv"
		d3.csv("/assets/data/spanish_memos_update.csv", function(data){
			processMemos(data)
		})
	}
	else if (countryName == "French"){
		f = "/assets/data/french_points.csv"
		d3.csv("/assets/data/french_memos_update.csv", function(data){
			processMemos(data)
		})
	}
	else{
		console.log("Invalid country name.")
		return
	}
	d3_queue.queue()
		.defer(getShipData, f)
		.await(refreshHexes)
}

function refreshHexes(){
	console.log("Loaded ship data.")
	removeHexes()
	displayShipDataHexes(globals.data.ships)
	console.log("Refreshed hexes.")
}

function loadShipLookup(){
	//laods metadata about ships and voyages from the disk
	d3.csv("/assets/data/ship_lookup.csv",function(data){
		globals.data.shipLookup = data;
	});

}


///memo filtering functions
function filterToBiology(memoSet){
	//returns a an array of memos with only memos reporting biology included
	o = _.where(memoSet, {memoType: "Biology"})
	return o
}
function filterToShipAndRig(memoSet){
	//returns an array of memos with only those reportingon the ship's condition included
	o= _.where(memoSet, {memoType: "shipAndRig"})
	return o
}
function filterToAnchored(memoSet){
	//returns an array of memos with only those that note that the ships is anchored included
	o = _.where(memoSet, {memoType: "anchored", memoText: "True"})
	return o
}

function filterToGenObs(memoSet){
	///returns an array of memos with only those that report on the day's general observations included
	o= _.where(memoSet, {memoType: "generalObservations"})
	return o
}
function filterToCargo(memoSet){
	//returns an array of memos with only those that report on the ships cargo included
	o = _.where(memoSet, {memoType: "cargo"})
	return o
}
function filterToWarsAndFights(memoSet){
	//returns an array of memos with only those that report on the conflicts on board included
	o = _.where(memoSet, {memoType: "warsAndFights"});
	return o
}
function filterToLifeOnBoard(memoSet){
	///returns an array of memos with only those that report on life on board included
	o= _.where(memoSet, {memoType: "lifeOnBoard"})
	return o
}
function filterToVoyageID(memoSet, voyageID){
	//returns an array of memos all belonging to the same voyage
	o= _.where(memoSet, {voyageID: String(voyageID)});
	return o
}
function filterToLocationID(memoSet, locationID){
	//returns an array of memos all belonging to the same location
	o= _.where(memoSet, {locationID: String(locationID)})
	return o
}
function filterToTimeRange(memoText, temporalFilter){
	//returns an array of memos whose dates fall between a min and amax specified value
	//temporal filter should be like {minDate: [date], maxDate: [date]}
	o = _.filter(memoSet, function(d){
		return (d.date > temporalFilter.minDate && d.date < temporalFilter.maxDate)
	})
}

function filterToHexBin(memoSet, hexbin){
	//returns an array of memos for a hex bin
	locs = []
	for (i in hexbin){
		v = hexbin[i]
		if (typeof v == 'object'){//hexbins have other properties that arent the location points
			locationID = String(v['locationID'])
			locs.push(locationID);
		}
	}
	o = _.filter(memoSet, function(d){
		return (locs.indexOf(String(d.locationID)) != -1)
	})
	return o
}

//change projection on widget change
$(".projSelect").change(function(){
	proj = $(this).val()
	changeProjection(proj)
})

function displayMemos(memoSet){
	//displays the feed of observations in the right hand panel
	$("#feed").empty();
	for (item in memoSet){
		memo = memoSet[item]
		text = memo.memoText;
		latitude = memo.Latitude
		longitude = memo.Longitude
		date = moment(memo.date)
		meta = lookupVoyageID(memo['voyageID'])
		captain = meta['captainName']
		captainRank = meta['rank']
		fromPlace = meta['fromPlace']
		toPlace = meta['toPlace']
		shipName = meta['shipName']
		shipType = meta['shipType']
		nationality = meta['nationality']
		voyageStart = moment(meta['voyageStartDate'])
		var duration = moment.duration(date.diff(voyageStart));
		var daysSinceStart = Math.round(duration.asDays());
		if (daysSinceStart < 0){
			return
		}
		html = "<li class='list-group-item'>"
		html += "<h6>" + captainRank + " " + captain + "</h6><span class='text-muted'><i>" + shipName + "</i>" + "</span><br />"
		html += "<p class='log-entry'>" + text + "</p>"
		html += "</li>"
		$("#feed").append(html)
	}
}

//lookup functions
function lookupCaptainInfo(captainName){
	//returns an array of voyage objects that have the given captain
	o = _.where(globals.data.shipLookup, {
		captainName: captainName
	})
	return o
}
function lookupVoyageFrom(fromPlace){
	//returns an array of voyages that started at the given place
	o = _.which(globals.data.shipLookup, {
		where: fromPlace
	})
	return o
}

function lookupVoyageTo(toPlace){
	//returns an array of voyages that end at the given place
	o = _.where(globals.data.shipLookup, {
		toPlace: toPlace
	})
	return o
}
function lookupShipName(shipName){
	//returns an array of voyages taken by a given ship
	o = _.where(globals.data.shipLookup, {
		shipName: shipName
	})
	return o
}
function lookupCompany(company){
	//returns an array of voyages made by ships of a given company
	o = _.where(globals.data.shipLookup,{
		companyName: company
	})
	return o
}
function lookupShipType(shipType){
	//returns an array of voyages made by ships of a given type
	o = _.where(globals.data.shipLookup, {
		shipType: shipType
	})
	return o
}

function lookupVoyageID(voyageID){
	//returns voyage metadata matching the given voyageID --> should only be one
	o = _.where(globals.data.shipLookup, {
		voyageID: voyageID
	});
	return o[0]
	
}

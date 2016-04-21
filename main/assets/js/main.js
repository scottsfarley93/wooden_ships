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
    .translate([globals.map.dimensions.width / 2, globals.map.dimensions.height / 2])
    .scale(scale0)
    .scaleExtent([scale0, 8 * scale0])
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

	    //create new svg container for the map
	    globals.map.mapContainer = mapContainer = d3.select("#map")
	        .append("svg")
	        .attr("class", "mapContainer")
	        .attr("width", globals.map.dimensions.width)
	        .attr("height",  globals.map.dimensions.width);
	        
	        
	    globals.map.g = globals.map.mapContainer.append("g");

		globals.map.mapContainer.append("rect")
		    .attr("class", "overlay")
		    .attr("width", globals.map.dimensions.width)
		    .attr("height", globals.map.dimensions.height);
		
		
	        
	    //use queue.js to parallelize asynchronous data loading
	    d3_queue.queue()
	        .defer(d3.json, "assets/data/land.topojson") //load base map data
	        .await(callback);
	        
		function callback(error, base, overlay1, overlay2, overlay3){
			//happens once the ajax have returned
	        console.log(error);
	        console.log(base);
	        
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
	         
	         globals.land = globals.map.mapContainer.selectAll(".land")
	            .data(landBase)
	            .enter()
	            .append("path")
	            .attr("class", "land")
	            //.style("stroke", "black").style("fill", "blue"); 

	        console.log(globals.land)
	         
	         changeProjection("VDG");
	     
	     globals.map.mapContainer.call(zoom).call(zoom.event)
	      
	    	
	}; //end of callback
};//end of set map

function zoomed() {
    // mapContainer.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    // mapContainer.selectAll(".land").style("stroke-width", 1.5 / d3.event.scale + "px");
    console.log("Zoomed")
  //globals.map.mapContainer.selectAll(".hexagon").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  
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
    else if (projection == "mercator"){
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
    }
   var path = d3.geo.path()
    .projection(projection);
   //make global
   globals.map.projection = projection;
   globals.map.path = path;
   //do the update
   globals.land.transition().attr('d', path)
   
   //update the hexagons
   changeHexSize(globals.map.hexRadius)
};

// function getShipsData(filter, callback){
	// var t1, t2
	// $.ajax("http://grad.geography.wisc.edu/sfarley2/data.php", {
		// beforeSend: function(){
			// t1 = new Date().getTime();
			// console.log("Getting ships from: " + this.url)
			// $("#loading").show();
			// $("#nation-select-list").hide();
		// },
		// error: function(xhr, status, error){
			// console.log("ERROR: " + error);
		// },
		// data: filter,//this is an object with API parameters
		// dataType: "jsonp",//so we can reach an external server
		// success: function(response){
			// t2 = new Date().getTime();
			// console.log("Got response from ships server.");
			// globals.data.ships = response['data'];
			// console.log("Roundtrip to server took " + ((t2-t1)/1000) + " seconds.")
			// $("#")
			// //now we can do any callback we want
			// if (callback){
				// callback(response);
			// }
			// $("#splashModal").modal('hide')
			// $("#loading").hide();
		// }
	// })
// }
// //event listener for nation select
// 
// $(".nation-select").click(function(){
	// //load ships on button click
	// var nation = $(this).text();
	// //load ships data with this nation
	// filter = {
		// nationality: nation
	// };
	// getShipsData(filter);
// })
// 
// 
// $("#loading").hide()

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
	 globals.map.hexagons = globals.map.mapContainer.append("g")
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
      	d3.select(this).style({'stroke': 'white', "stroke-width": 2})
      })
      .on('mouseout', function(d){
      	d3.select(this).style({'stroke': 'orange', 'stroke-width' : 0.25})
      })
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
		d3.csv("/assets/data/british_memos.csv", function(data){
			processMemos(data)
		})
	}
	else if (countryName == "Dutch"){
		f = "/assets/data/dutch_points.csv"
		d3.csv("/assets/data/dutch_memos.csv", function(data){
			processMemos(data)
		})
	}
	else if (countryName == "Spanish"){
		f = "/assets/data/spanish_points.csv"
		d3.csv("/assets/data/spanish_memos.csv", function(data){
			processMemos(data)
		})
	}
	else if (countryName == "French"){
		f = "/assets/data/french_points.csv"
		d3.csv("/assets/data/french_memos.csv", function(data){
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
function filterToWindForce(memoSet){
	//returns an array of memos with only those reporting on the wind force included
	o = _.where(memoSet, {memoType: "windForce"})
	return o
}
function filterToCurrentSpeed(memoSet){
	//returns an array of memos with only those reporting on the current travel speed included
	o = _.where(memoSet, {memoType: "currentTravelSpeed"});
	return o;
}
function filterToSeaState(memoSet){
	//returns an array of memos with only those reporting on the state of the sea included
	o = _.where(memoSet, {memoType: "stateOfSea"});
	return o
}
function filterToClearness(memoSet){
	//returns an array of memos with only those reporting on the currently clearness reported
	o =_.where(memoSet, {memoType: "clearness"});
	return o
}
function filterToCloudFraction(memoSet){
	//returns an array of memos with only those reporting on cloud fraction reported
	o = _.where(memoSet, {memoType: "cloudFraction"})
	return o
}
function filterToWindDirection(memoSet){
	//returns an array of memoswith only those reporting on wind direction included
	o = _.where(memoSet, {memoType: "windDirection"});
	return o
}
function filterToCurrentTravelDirection(memoSet){
	//returns an array of memos with only those reporting on current travel direction included
	o = _.where(memoSet, {memoType: "currentTravelDirection"})
	return o
}
function filterToAnchored(memoSet){
	//returns an array of memos with only those that note that the ships is anchored included
	o = _.where(memoSet, {memoType: "anchored", memoText: "True"})
	return o
}
function filterToAllWindForces(memoSet){
	//returns an array of memos with only those that report on the day's wind directions included
	o = _.where(memoSet, {memoType: "allWindForces"});
	return o
}
function filterToGenObs(memoSet){
	///returns an array of memos with only those that report on the day's general observations included
	o= _.where(memoSet, {memoType: "generalObservations"})
	return o
}
function filterToCloudShape(memoSet){
	//returns an array of memos with only those that report on the cloud's shapes included
	o = _.where(memoSet, {memoType: "shapeOfClouds"})
	return o
}
function filterToCloudDirection(memoSet){
	//returns an array of memos with only those that report on the cloud's directions included
	o = _.where(memoSet, {memoType: "directionOfClouds"})
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
function filterToAllWindDirections(memoSet){
	//returns an array of memos with only those that report on the day's wind directions incldued
	o = _.where(memoSet, {memoType: "allWindDirections"})
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




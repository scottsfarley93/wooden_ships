///this is Wooden Ships Main Javascript File
//All functions are here

var attrArray = ["countries_1715", "countries_1783", "countries_1815"];

var expressed = attrArray[0]

var months = moment.months()
var weekdays = moment.weekdays()

var attrProj = ["VDG", "Mercator", "sat"]; // list of projections

globals = {}
globals.basemap = {}
globals.map = {}
globals.map.dimensions ={};
globals.map.dimensions.height = $(window).height() * 0.9; //90% of the window height
globals.map.dimensions.width = $(window).width() //100% of the window width
globals.map.projection;
globals.map.path;

globals.mamoType = "All"

globals.data = {};
globals.data.filteredShips = []; //keep track of the currently applied filter

globals.map.hexRadius = 5;

scale0 = (globals.map.dimensions.width - 1) / 2 / Math.PI;

globals.filter = {} //keep track of the currently applied filter

globals.memoTooltip = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);


var radius = d3.scale.sqrt()
    .domain([0, 12])
    .range([0, 8]);

var expressedProj = attrProj[0];


//this should be replaced with a better coloring func
var color = d3.scale.linear()
    .domain([0, 60])
    .range(["green","darkred"])
    .interpolate(d3.interpolateLab);
    
parseDate = d3.time.format("%x").parse;

var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([1, 21])
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


setMap(); //creates the map --> ASAP

$(document).ready(function(){
	//stuff that happens as the map is created.
	loadCaptainMetadata() //loads images and datas about the captains
	loadWikiData() //loads data about the ships
	getPorts();//get the port cities and display them
	changeCountry("British")
	loadShipLookup() // get metadata about ships and voyages and captains
	d3.selectAll(".overlay").style('display', 'none')//disables zoom --> for debugging
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

		// globals.map.mapContainer.append("rect")//this is the zoom overlay -->THIS IS WHERE THE PROBLEM IS --> LAYER STACK IS AN ISSUE
		    // .attr("class", "overlay")
		    // .attr("width", globals.map.dimensions.width)
		    // .attr("height", globals.map.dimensions.height)
		 globals.map.mapContainer.call(zoom).call(zoom.event)
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
	d3.selectAll(".land").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	d3.selectAll(".hexagons").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	d3.selectAll(".port").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	//d3.selectAll(".hexagon").moveToFront();
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
			d.winddirection = +d.windDirection;
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
	      .style("fill", function(d) { return color(d3.mean(d, function(d) { return +d.windSpeed; })); })
	      .style('stroke-width', 0.25)
	      .on('click', function(d){
	      	//memos = filterToHexBin(globals.data.memos, d)
	      	//console.log(memos)
	      	console.log(d);
      })
      .on('mouseover', function(d){
      	d3.select(this).moveToFront()
      	d3.select(this).style({'stroke': 'white', "stroke-width": 1})
      	memos = filterToHexBin(globals.filteredMemos, d)
      	displayMemos(memos)
      	summary = getSummaryOfHex(d)
      	displaySummary(summary)
      })
      .on('mouseout', function(d){
      	d3.select(this).style({'stroke': 'orange', 'stroke-width' : 0.25})
      })
      //set the stack order
      globals.land.moveToFront();
}

function getPorts(){        
	//load the port cities from a csv file on disk
	  d3.csv("/assets/data/port_cities.csv", function(data){
	  	globals.data.ports = data;
	  	displayPorts(data);
	  })
}

function displayPorts(portData){
	globals.ports = globals.map.features.selectAll(".port")
		.data(portData)
		.enter().append('g')
		.attr('class', 'port')
		
	globals.ports
		.append("circle")
		.attr('class', 'port-marker')
		.attr("cx", function(d){
			projx = globals.map.projection([d.Longitude, d.Latitude])[0]
			return projx
		})
		.attr("cy", function(d){
			projy = globals.map.projection([d.Longitude, d.Latitude])[1]
			return projy
		})
		.attr('r', 1)
		.style('fill', 'black')
		.style('stroke', 'black')
		
	globals.ports
		.append('text')
			.attr('class', 'port-label')
			.attr('x', function(d){return globals.map.projection([d.Longitude, d.Latitude])[0] + 5})
			.attr('y', function(d){return globals.map.projection([d.Longitude, d.Latitude])[1] - 5})
			.style('font-size', '10px')
			.text(function(d){
				return d.OriginalName
			})
			.style('fill', 'black')
			.on('mouseover', function(){
				d3.select(this).style("fill", 'white').style("cursor", "crosshair")
				d3.select(this).moveToFront();
				
			})
			.on('mouseout', function(){
				d3.select(this).style('fill', 'black').style("cursor", "auto")
			})
}

function refreshStackOrder(){
	d3.selectAll(".overlay").moveToBack()
	d3.selectAll(".hexagon").moveToFront()
	globals.land.moveToFront()
	globals.ports.moveToFront()
	console.log("stack order complete")
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
	globals.filteredMemos = memos
	console.log("Done loading memos")
}

function changeCountry(countryName){
	//changes the map interface to reflect a new country's data.  Options are 'Dutch', 'French', 'British', 'Spanish'
	//load in new data
	
	
	if (countryName == "British"){
		f = "/assets/data/british_points_updated.csv"
		d3.csv("/assets/data/british_memos_updated.csv", function(data){
			processMemos(data)
		})
	}
	else if (countryName == "Dutch"){
		f = "/assets/data/dutch_points_updated.csv"
		d3.csv("/assets/data/dutch_memos_updated.csv", function(data){
			processMemos(data)
		})
	}
	else if (countryName == "Spanish"){
		f = "/assets/data/spanish_points_updated.csv"
		d3.csv("/assets/data/spanish_memos_updated.csv", function(data){
			processMemos(data)
		})
	}
	else if (countryName == "French"){
		f = "/assets/data/french_points_updated.csv"
		d3.csv("/assets/data/french_memos_updated.csv", function(data){
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
	o= _.where(memoSet, {memoType: "ShipAndRig"})
	return o
}
function filterToWeatherReports(memoSet){
	//returns an array of memos with only those reporting daily weather reports
	o = _.where(memoSet, {memoType: "weatherReport"})
	return o
}
function filterToOther(memoSet){
	//returns an array of memos with only those reporting other remarks included
	o = _.where(memoSet, {memoType: "OtherRem"})
	return o
}
function filterToAnchored(memoSet){
	//returns an array of memos with only those that note that the ships is anchored included
	o = _.where(memoSet, {memoType: "Anchor"})
	return o
}
function filterToEncounter(memoSet){
	o = _.where(memoSet, {memoType: "Encounter"})
	return o
}
function filterToTravel(memoSet){
	o = _.where(memoSet, {memoType: 'travelReport'})
	return o
}

function filterToLandmarks(memoSet){
	o = _.where(memoSet, {memoType: "Landmark"})
	return o
}
function filterToCargo(memoSet){
	//returns an array of memos with only those that report on the ships cargo included
	o = _.where(memoSet, {memoType: "Cargo"})
	return o
}
function filterToWarsAndFights(memoSet){
	//returns an array of memos with only those that report on the conflicts on board included
	o = _.where(memoSet, {memoType: "WarsAndFights"});
	return o
}
function filterToLifeOnBoard(memoSet){
	///returns an array of memos with only those that report on life on board included
	o= _.where(memoSet, {memoType: "LifeOnBoard"})
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
	$("#feed").empty()
	d3.select("#feed").selectAll(".log")
		.data(memoSet)
		.enter()
		.append("li")
			.attr('class', 'log')
			.attr('class', 'list-group-item')
			.html(function(d){
				meta = lookupVoyageID(d['voyageID'])
				text = d.memoText;
				latitude = d.Latitude
				longitude = d.Longitude
				date = moment(d.date)
				meta = lookupVoyageID(d['voyageID'])
				captain = meta['captainName']
				captainRank = meta['rank']
				fromPlace = meta['fromPlace']
				toPlace = meta['toPlace']
				shipName = meta['shipName']
				shipType = meta['shipType']
				nationality = meta['nationality']
				voyageStart = moment(meta['voyageStart'])
				var duration = moment.duration(date.diff(voyageStart));
				var daysSinceStart = Math.abs(Math.round(duration.asDays()));
				
				//add this properties so we can access them on mouseover
				d['captainName'] = captain
				d['captainRank'] = captainRank
				d['observer'] = meta['captainName2']
				d['observerRank'] = meta['captainRank2']
				d['fromPlace'] = fromPlace
				d['toPlace'] = toPlace
				d['shipName'] = shipName
				d['shipType'] = shipType
				d['nationality'] = nationality
				d['voyageStart'] = voyageStart
				d['company'] = meta['company']
				d['voyageDaysSinceStart'] = daysSinceStart

				if (!captain || captain ==""){
					captain = "Unknown"
				}
				

				img = lookupCaptainImage(captain);
				d.imgSrc = img
				formatDate = moment.weekdays()[date.weekday()] + ", " + date.date() + nth(date.date()) + " " + moment.months()[date.month() - 1] + ", " + date.year()
				//this is the feed entry
				html = "<div class='row log-row basic-hovercard' id='log_" + d.locationID + "'>"
				html += "<img src='" + img + "' class='captain-thumb col-xs-3'/>"
				html += "<div class='col-xs-9 log-header' id='header_" + d.locationID + "'>"
				html += "<h6 class='captain-heading' class='col-xs-12'>" + captainRank + " " + captain + "</h6>"
				html += "<small class='log-shipname col-xs-12 text-muted'>" + shipName + "</small>"
				html += "<i class='log-date col-xs-12 text-muted'>" + formatDate + "</i>"
				html += "<p class='log-entry'>" + text + "</p>"
				html += "</div>"
				html += "</div>"

				return html;
			}).on("mouseover", function(d) {
				//make the html
				html = "<div class='row'>"
				html += "<div class='col-xs-6'>"
				html += "<img class='captain-thumb img-rounded hover-img col-xs-12' src='" + d.imgSrc + "'>"
				html += "</div><div class='col-xs-6'>"
				html += "<h5>" + d.shipName + "</h5>"
				html += "<h6>" + d.shipType + "</h5>"
				html += "<i>" + d.captainRank + " " + d.captainName + "<i>"
				html += "<p>Nationality: " + d.nationality + "</p>"
				html += "<p>Voyage Started: " + d.voyageStart.toLocaleString() + "</p>"
				html += "<p>Sailing From: " + d.fromPlace + "</p>"
				html += "<p>Sailing To: " + d.toPlace + "</p>"
				html += "<p>Days at sea: " + d.voyageDaysSinceStart + "</p>"
				html += "<p>Sailing for: " + d.company + "</p>"
				if (d.captainName2){
					html += "<p>Second Observer: " + d.captainRank2 + " " + d.captainName2 + "</p>"
				}
				html += "</div>"
				
				//try to lookup from wikipedia
				if (d.company == "RN"){
					shipWiki = _.where(globals.data.rn_wiki, {
						ShipName: d.shipName.toUpperCase()
					})
					console.log(shipWiki)
					for (item in shipWiki){
						html += "<p>" + shipWiki[item].Text + "</p>"
					}
				}

				
				//positioning
				pos = $(this).position();
				divPos = pos.top + ($(this).height() / 2)
				
				d3.select(this).style('background-color','#cccccc')	 //highlight
					
	            globals.memoTooltip.transition()		
	                .duration(200)		
	                .style("opacity", .9);		
	            globals.memoTooltip.html(html)	
	                .style("right", "280px")		
	                .style("top", divPos + "px");	
            })					
        .on("mouseout", function(d) {	
        	d3.select(this).style('background-color','white')	//de highlight	
            globals.memoTooltip.transition()		 //remove
                .duration(500)		
                .style("opacity", 0);	
        });
			
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

function nth(d) {
	//formats ordinal numbers --> 1st, 2nd, 3rd etc
  if(d>3 && d<21) return 'th'; 
  switch (d % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
} 

function loadCaptainMetadata(){
	d3.csv("/assets/data/captain_metadata.csv", function(data){
		globals.data.captain_metadata = data;
		console.log('Got metadata for captains')
	})
}
function lookupCaptainImage(captainName){
	//lookup the image for this captain from the lookup file
	o = _.findWhere(globals.data.captain_metadata, {captainName: captainName});
	if (o){
		return o.Image;
	}else{
		return ""
	}
}

function getSummaryOfHex(hexbin){
	//returns an object with the aggregate weather summary from this hex bin
	props = {}
	props['centroidx'] = hexbin.x
	props['centroidy'] = hexbin.y
	props['numInBin'] = hexbin.length
	props['fog'] = 0
	props['snow'] = 0
	props['gusts'] = 0
	props['thunder'] = 0
	props['hail'] = 0
	props['rain'] = 0
	props['seaIce'] = 0
	props['meanAirTemp'] = 0;
	props['meanPressure'] = 0;
	props['meanSST'] = 0;
	props['numAirTemp'] = 0;
	props['numPressure'] = 0;
	props['numSST'] = 0;
	props['numWindSpeed'] = 0;
	props['meanWindSpeed'] = 0;
	props['numWindDirection'] = 0;
	props['meanWindDirection'] = 0;
	for (item in hexbin){
		v = hexbin[item]
		if (typeof(v) == "object"){//make sure we are looking at the actual data objects not the hex metadata
			if (v['fog'] == "True"){//these are still strings not booleans 
				props['fog'] += 1;
			}
			if (v['snow'] == "True"){
				props['snow'] += 1;
			}
			if (v['gusts'] == "True"){
				props['gusts'] += 1;
			}
			if(v['thunder'] == "True"){
				props['thunder'] += 1;
			}
			if (v['hail'] == 'True'){
				props['hail'] +=1;
			}
			if(v['seaIce'] == "True"){
				props['seaIce'] += 1;
			}
			if (v['rain'] == "True"){
				props['rain'] += 1;
			}
			if (v['airTemp'] != -1){
				props['numAirTemp'] += 1;
				props['meanAirTemp'] += v['airTemp']
			}
			if(v['pressure'] != -1){
				props['numPressure'] +=1 ;
				props['meanPressure'] += v['pressure']
			}
			if(v['sst'] != -1){
				props['numSST'] += 1;
				props['meanSST'] += v['sst']
			}
			if(v['windSpeed'] != -1){
				props['numWindSpeed'] +=1;
				props['meanWindSpeed'] += v['windSpeed']
			}	
			if(v['winddirection'] != -1 && v['winddirection'] != 999){
				props['numWindDirection'] +=1;
				props['meanWindDirection'] += v['winddirection']
			}
		}
	} //end for loop
	//correct the means, but don't divide by zero
	if (props['numAirTemp'] != 0){
		props['meanAirTemp'] = props['meanAirTemp'] / props['numAirTemp']
	}else{
		props['meanAirTemp'] = false;
	}
	if (props['numPressure'] != 0){
		props['meanPressure'] = props['meanPressure'] / props['numPressure']
	}else{
		props['meanPressure'] = false;
	}
	if (props['numSST'] != 0){
		props['meanSST'] = props['meanSST'] / props['numSST']
	}else{
		props['meanSST'] = false;
	}
		if (props['numWindSpeed'] != 0){
		props['meanWindSpeed'] = props['meanWindSpeed'] / props['numWindSpeed']
	}else{
		props['meanWindSpeed'] = false;
	}
	if (props['numWindDirection'] != 0){
		props['meanWindDirection'] = props['meanWindDirection'] / props['numWindDirection']
	}else{
		props['meanWindDirection'] = false;
	}
	return props
}

function enterIsolationMode(){
	
}
function exitIsolationMode(){
	
}
function displaySummary(props){
	$("#weatherSummaryList").empty()
	html = "<li class='list-group-item'>Number of observations: " + props['numInBin'] + "</li>"
	html += "<li class='list-group-item'>X-Centroid: " + round2(props['centroidx']) + "</li>"
	html += "<li class='list-group-item'>Y-Centroid: " + round2(props['centroidy']) + "</li>"
	html += "<li class='list-group-item'>Fog: " + props['fog'] + "<span class='text-muted'>(" + round2(props['fog'] / props['numInBin'] * 100)  + "%)</li>"
	html += "<li class='list-group-item'>Rain: " + props['rain'] + "<span class='text-muted'>(" + round2(props['rain'] / props['numInBin'] * 100)  + "%)</li>"
	html += "<li class='list-group-item'>Snow: " + props['snow'] + "<span class='text-muted'>(" + round2(props['snow'] / props['numInBin'] * 100)  + "%)</li>"
	html += "<li class='list-group-item'>Thunder: " + props['thunder'] + "<span class='text-muted'>(" + round2(props['thunder'] / props['numInBin'] * 100)  + "%)</li>"
	html += "<li class='list-group-item'>Sea Ice: " + props['seaIce'] + "<span class='text-muted'>(" + round2(props['seaIce'] / props['numInBin'] * 100)  + "%)</li>"
	html += "<li class='list-group-item'>Hail: " + props['hail'] + "<span class='text-muted'>(" + round2(props['hail'] / props['numInBin'] * 100)  + "%)</li>"
	html += "<li class='list-group-item'>Thunder: " + props['thunder'] + "<span class='text-muted'>(" + round2(props['thunder'] / props['numInBin'] * 100)  + "%)</li>"
	html += "<li class='list-group-item'>Mean Air Temperature (*C): " + round2(props['meanAirTemp']) + "<span class='text-muted'>(" + (props['numAirTemp'])  + " obs.)</li>"
	html += "<li class='list-group-item'>Mean Pressure (mmHg): " + round2(props['meanPressure']) + "<span class='text-muted'>(" + (props['numPressure'])  + " obs.)</li>"
	html += "<li class='list-group-item'>Mean Wind Speed (m/s): " + round2(props['meanWindSpeed']) + "<span class='text-muted'>(" + (props['numWindSpeed'])  + " obs.)</li>"
	html += "<li class='list-group-item'>Mean Wind Direction (deg): " + round2(props['meanWindDirection']) + "<span class='text-muted'>(" + (props['numWindDirection'])  + " obs.)</li>"
	$("#weatherSummaryList").append(html)
}

function loadWikiData(){
	d3.csv("assets/data/rn_ship_wikipedia.csv", function(data){
		globals.data.rn_wiki = data
		console.log("Loaded royal navy wiki.")
	})
}


function changeMemoSet(){
	v = $(this)
	memoType = v.val()
	globals.memoType = memoType
	if (memoType == "All"){
		globals.filteredMemos = globals.data.memos
	}else if (memoType == "Biology"){
		globals.filteredMemos = filterToBiology(globals.data.memos)
	}else if (memoType == "WeatherReports"){
		globals.filteredMemos=filterToWeatherReports(globals.data.memos)
	}else if (memoType == "cargo"){
		globals.filteredMemos = filterToCargo(globals.data.memos)
	}else if (memoType == "warsAndFights"){
		globals.filteredMemos = filterToWarsAndFights(globals.data.memos)
	}else if (memoType == "shipAndRig"){
		globals.filteredMemos = filterToShipAndRig(globals.data.memos)
	}else if(memoType == "other"){
		globals.filteredMemos = filterToOther(globals.data.memos)
	}else if(memoType == "lifeOnBoard"){
		globals.filteredMemos = filterToLifeOnBoard(globals.data.memos)
	}else if (memoType == "Travel"){
		globals.filteredMemos = filterToTravel(globals.data.memos)
	}else if (memoType == "enc"){
		globals.filteredMemos = filterToEncounter(globals.data.memos)
	}else if (memoType == 'anchor'){
		globals.filteredMemos = filterToAnchored(globals.data.memos)
	}else if(memoType == "landmarks"){
		globals.filteredMemos = filterToLandmarks(globals.data.memos)
	}
	console.log(globals.filteredMemos)
}
$(".memoSelect").change(changeMemoSet)


function round2(num){
	//rounds to at most two decimal places
	return Math.round(num * 100) / 100;
}

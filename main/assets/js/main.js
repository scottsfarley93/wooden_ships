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



$(document).ready(function(){
	//stuff that happens as the map is created.
	setMap(); //creates the map
	getShipData(displayShipDataHexes) //get the ship data 
	//createDropdown(attrArray); //creates the dropdown menu for years/basemap
	//projDropdown(attrProj) //creates the dropdown menu for projection
	
	//open the modal dialog --> splash screen
	//$("#splashModal").modal('show')
})


//set up map and call data
function setMap(){

	    //create new svg container for the map
	    globals.map.mapContainer = mapContainer = d3.select("#map")
	        .append("svg")
	        .attr("class", "mapContainer")
	        .attr("width", globals.map.dimensions.width)
	        .attr("height",  globals.map.dimensions.width);
	        
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
	            .style("stroke", "black").style("fill", "blue"); 

	        console.log(globals.land)
	         
	         changeProjection("VDG");
	   console.log(globals.data)
	    
	    	
	}; //end of callback
};//end of set map

function zoomed() {
    mapContainer.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    mapContainer.selectAll(".land").style("stroke-width", 1.5 / d3.event.scale + "px");
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

function getShipData(callback){
	d3.csv("assets/data/british_points.csv", function(data){
		//console.log(data)
		_.each(data, function(d){
			d.airTemp = +d.airTemp;
			d.pressure = +d.pressure
			d.sst = +d.sst
			d.winddirection = +d.winddirection;
			d.windSpeed = +d.windSpeed;
			d.latitude = +d.latitude;
			d.longitude = +d.longitude;
			d.date = new Date(d.date)
			d.year = d.date.getFullYear()
			d.month = d.date.getMonth()
			d.day = d.date.getDay()
			d.windDir = binWindDirection(d.winddirection)			
		})
		//windSpeed(3, 10, d.windSpeed)
		//globals.data.winddirection = d.winddirection
		globals.data.ships = data //so we can revert later
		//console.log(globals.data.ships)
		globals.data.filteredShips = data //keep track of the most recent filtered data
		if (callback){
			callback(data)
		}
		
		filterByFog(globals.data.filteredShips);  
		filterByGusts(globals.data.filteredShips);
		filterByHail(globals.data.filteredShips);
		filterByRain(globals.data.filteredShips);
		filterBySeaIce(globals.data.filteredShips);
		filterBySnow(globals.data.filteredShips);
		filterByThunder(globals.data.filteredShips);
		filterWindSpeed(24,26,globals.data.filteredShips);
		filterYear(1801, 1805, globals.data.filteredShips);
		filterMonth(11, 12, globals.data.filteredShips);
		filterSST(globals.data.filteredShips);
		filterAirTemp(globals.data.filteredShips);
		filterByAirTemp(22, 28, globals.data.filteredShips);
		filterPressure(globals.data.filteredShips);
		filterByPressure(700,750,globals.data.filteredShips)
		
		
		
		
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
      .attr("d", globals.map.hexbin.hexagon())
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      //.style("fill", function(d) { return color(d3.median(d, function(d) { return +d.date; })); });
      .attr("fill", 'green')
      .attr('stroke', 'orange').style('stroke-width', 0.25)
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

function filterByFog(data){
	f = _.where(data, {fog : "True"});
	return f;
}

function filterByGusts(data){
	f = _.where(data, {gusts : "True"});
	return f;
}

function filterByHail(data){
	f = _.where(data, {hail : "True"});
	return f;
}

function filterByRain(data){
	f = _.where(data, {rain : "True"});
	return f;
}

function filterBySeaIce(data){
	f = _.where(data, {seaIce : "True"});
	return f;
}

function filterBySnow(data){
	f = _.where(data, {snow : "True"});
	return f;
}

function filterByThunder(data){
	f = _.where(data, {thunder : "True"});
	return f;
}


function binWindDirection(num){
	if (num >= 337.5 || num < 22.5) {
		windDir = "N"
	} else if (num >= 22.5 && num < 67.5) {
		windDir = "NE"		
	} else if (num >= 67.5 && num < 112.5){
		windDir = "E"
	} else if (num >= 112.5 && num < 157.5){
		windDir = "SE"
	} else if (num >= 157.5 && num < 202.5){
		windDir = "S"
	} else if (num >= 202.5 && num < 247.5) {
		windDir = "SW"
	} else if (num >= 247.5 && num < 292.5) {
		windDir = "W"
	} else if (num >= 292.5 && num < 337.5) {
		windDir = "NW"
	}
	return windDir
}
//control hex bin size

function filterWindSpeed(minSpeed, maxSpeed, data) {
	f = _.filter(data, function(element){
		if (element.windSpeed >= minSpeed && element.windSpeed <= maxSpeed) 	
			return true;	 	
})		
		return f;
}

function filterYear(minYear, maxYear, data) {
	f = _.filter(data, function(element){
		if (element.year >= minYear && element.year <= maxYear) 	
			return true;	 	
})		
		return f;
}

function filterMonth(minMonth, maxMonth, data) {
	f = _.filter(data, function(element){
		if (element.month >= minMonth && element.month <= maxMonth) 	
			return true;	 	
})		
		return f;
}

function filterSST(data) {
	f = _.filter(data, function(element){
		if (element.sst > -1) 	
			return true;	 	
})		
		return f;
}

//this function just returns whether AirTemp recorded
function filterAirTemp(data) {
	f = _.filter(data, function(element){
		if (element.airTemp > -1) 	
			return true;	 	
})		
		return f;
}

//this function takes AirTemp min and max
function filterByAirTemp(minTemp, maxTemp, data) {
	f = _.filter(data, function(element){
		if (element.airTemp >= minTemp && element.airTemp <= maxTemp) 	
			return true;	 	
})		
		return f;
}

//this function just returns whether Pressure recorded
function filterPressure(data) {
	f = _.filter(data, function(element){
		if (element.pressure > -1) 	
			return true;	 	
})		
		return f;
}

//this function takes Pressure min and max
function filterByPressure(minPressure, maxPressure, data) {
	f = _.filter(data, function(element){
		if (element.pressure >= minPressure && element.pressure <= maxPressure) 	
			return true;	 	
})	
		console.log(f)	
		return f;
}

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
    .range(["green", "darkgreen", "red", "darkred"])
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
	    	.defer(d3.json, "assets/data/cntry1715.topojson") //load overlay spatial data of countries
	    	.defer(d3.json, "assets/data/cntry1783.topojson") //load overlay spatial data of countries
	    	.defer(d3.json, "assets/data/cntry1815.topojson") //load overlay spatial data of countries
	        .await(callback);
	        
		function callback(error, base, overlay1, overlay2, overlay3){
			//happens once the ajax have returned
	        console.log(error);
	        console.log(base);
	        
	        //translate europe TopoJSON
	        var landBase = topojson.feature(base, base.objects.ne_110m_land).features,
	            countriesOverlay1 = topojson.feature(overlay1, overlay1.objects.cntry1715).features;
	            countriesOverlay2 = topojson.feature(overlay2, overlay2.objects.cntry1783).features;
	            countriesOverlay3 = topojson.feature(overlay3, overlay3.objects.cntry1815).features;
	        
	        var countries_1715 = mapContainer.selectAll(".countries_1715")
	            .data(countriesOverlay1)
	            .enter()
	            .append("path")
	            .attr("class", function(d){
	                return "countries_1715 " + d.properties.name;
	            })
	         
	         globals.countries = countries_1715;  
	         
	         
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
	         
	         globals.land = mapContainer.append("path")
	            .datum(landBase)
	            .attr("class", "land"); 
	         
	         changeProjection("VDG");
	      
	    	
	}; //end of callback
};//end of set map
	         
	         
		
//dropdown change listener handler
function changeAttribute(attribute){
    //change the expressed attribute
    expressed = attribute;
    if (expressed == attrArray[0]) {
        var expressed = globals.map.mapContainer.selectAll("." + expressed)
            .data(countriesOverlay1)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "countries_1715 " + d.properties.name;
            })
            .attr("d", globals.map.path);
    	}
    else if (expressed == attrArray[1]) {
        var expressed = globals.map.mapContainer.selectAll("." + expressed)
            .data(countriesOverlay2)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "countries_1783 " + d.properties.name;
            })
            .attr("d", globals.map.path);
    	}
    else {
    	var expressed = globals.map.mapContainer.selectAll("." + expressed)
            .data(countriesOverlay3)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "countries_1815 " + d.properties.name;
            })
            .attr("d", globals.map.path);    
    	}
};

	
	

//function to create a dropdown menu for attribute selection
function createDropdown(attrArray){
    //add select element
    var dropdown = d3.select("#controls")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Year");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
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
   globals.countries.transition().attr('d', path)
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
		console.log(data)
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
      .attr("d", globals.map.hexbin.hexagon())
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      //.style("fill", function(d) { return color(d3.median(d, function(d) { return +d.date; })); });
      .attr("fill", function(d) { return color(d.length); })
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
//control hex bin size

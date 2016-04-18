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

var expressedProj = attrProj[0];



$(document).ready(function(){
	//stuff that happens as the map is created.
	setMap(); //creates the map
	createDropdown(attrArray); //creates the dropdown menu for years/basemap
	projDropdown(attrProj) //creates the dropdown menu for projection
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
	        .defer(d3.json, "data/land.topojson") //load base map data
	    	.defer(d3.json, "data/cntry1715.topojson") //load overlay spatial data of countries
	    	.defer(d3.json, "data/cntry1783.topojson") //load overlay spatial data of countries
	    	.defer(d3.json, "data/cntry1815.topojson") //load overlay spatial data of countries
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
};
//this is a change

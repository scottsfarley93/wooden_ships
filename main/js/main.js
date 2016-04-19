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
	projDropdown(attrProj); //creates the dropdown menu for projection
    zoomed(); //allows map to zoom
    createSlider(); //creates temporal slider
    changeTime(date) //changes time on slider
})


//set up map and call data
function setMap(){

	    //create new svg container for the map
	    globals.map.mapContainer = mapContainer = d3.select("#map")
	        .append("svg")
	        .attr("class", "mapContainer")
	        .attr("width", globals.map.dimensions.width)
	        .attr("height",  globals.map.dimensions.width);

        var zoom = d3.behavior.zoom()
            .translate([0, 0])
            .scale(1)
            .scaleExtent([1, 2]) //change scale here (default is 1 constrained at zoom level 2)
            .on("zoom", zoomed);

            console.log(zoom.scale());
	        
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
                .call(zoom);
	         
	         globals.countries = countries_1715;  
	         
	         globals.land = mapContainer.append("path")
	            .datum(landBase)
	            .attr("class", "land") 
                .call(zoom);
	         
	         changeProjection("VDG");
	}; //end of callback

};//end of set map

function zoomed() {
    mapContainer.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    mapContainer.selectAll(".land").style("stroke-width", 1.5 / d3.event.scale + "px");
    mapContainer.selectAll(".countries").style("stroke-width", .5 / d3.event.scale + "px");
};

		
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

    }
    else if (projection == "sat"){
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


//function createSlider(){

    formatDate = d3.time.format("%Y");

    // parameters
    var margin = {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
    },
    width = 400 - margin.left - margin.right,
    height = 100 - margin.bottom - margin.top;

    // scale function
    var timeScale = d3.time.scale()
        .domain([new Date('1700-01-02'), new Date('1851-01-01')])
        .range([0, width])
        .clamp(true);

    // initial value
    var startValue = timeScale(new Date('1700-03-20'));
    startingValue = new Date('1700-03-20');

    //////////

    // defines brush
    var brush = d3.svg.brush()
        .x(timeScale)
        .extent([startingValue, startingValue])
        .on("brush", brushed);

    var svg = d3.select("#slider").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        // classic transform to position g
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
    // put in middle of screen
    .attr("transform", "translate(0," + height / 2 + ")")
    // inroduce axis
    .call(d3.svg.axis()
        .scale(timeScale)
        .orient("bottom")
        .tickFormat(function(d) {
        return formatDate(d);
        })
        .tickSize(0)
        .tickPadding(12)
        .tickValues([timeScale.domain()[0], timeScale.domain()[1]]))
        .select(".domain")
        .select(function() {
        console.log(this);
        return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "halo");

    var slider = svg.append("g")
        .attr("class", "slider")
        .call(brush);

    slider.selectAll(".extent,.resize")
        .remove();

    slider.select(".background")
        .attr("height", height);

    var handle = slider.append("g")
        .attr("class", "handle")

    handle.append("path")
        .attr("transform", "translate(0," + height / 2 + ")")
        .attr("d", "M 0 -20 V 20")

    handle.append('text')
        .text(startingValue)
        .attr("transform", "translate(" + (-18) + " ," + (height / 2 - 25) + ")");

    slider
        .call(brush.event)

    function brushed() {
        var value = brush.extent()[0];

        if (d3.event.sourceEvent) { // not a programmatic event
        value = timeScale.invert(d3.mouse(this)[0]);
        brush.extent([value, value]);
        }

        handle.attr("transform", "translate(" + timeScale(value) + ",0)");
        handle.select('text').text(formatDate(value));
        }
// }; // end createSlider function

function changeTime(date){

    var expressedTime = d3.selectAll("#map")
        .attr("stroke", "none")
        .attr("fill", "none");

    if (timeScale < Date('1783-01-02')){

        var expressed = globals.map.mapContainer.selectAll("." + expressed)
            .data(countriesOverlay1)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "countries_1715 " + d.properties.name;
            })
            .attr("d", globals.map.path)
            .attr("stroke", red)
            .attr("fill", red);
        }
    };
    
    else if (timeScale < Date('1815-01-02')){

        var expressed = globals.map.mapContainer.selectAll("." + expressed)
            .data(countriesOverlay2)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "countries_1783 " + d.properties.name;
            })
            .attr("d", globals.map.path)
            .attr("stroke", red)
            .attr("fill", red);
    }

    else if (timeScale < Date('1815-01-02')){
        
        var expressed = globals.map.mapContainer.selectAll("." + expressed)
            .data(countriesOverlay3)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "countries_1815 " + d.properties.name;
            })
            .attr("d", globals.map.path) 
            .attr("stroke", red)
            .attr("fill", red); 
    }

}; //end changeTime function



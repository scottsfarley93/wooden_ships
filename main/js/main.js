var attrArray = ["countries_1715", "countries_1783", "countries_1815"];

var expressed = attrArray[0]
console.log(expressed)
//load map

window.onload = setMap();

//set up map and call data
function setMap(){

	//map frame dimensions
    var width = window.innerWidth * 1,
        height = 550;

    //create new svg container for the map
    var mapContainer = d3.select("body")
        .append("svg")
        .attr("class", "mapContainer")
        .attr("width", width)
        .attr("height", height);

	var projection = d3.geo.vanDerGrinten4()
    	.scale(125)
   	 	.translate([width / 2, height / 2])
    	.precision(.1);

	var path = d3.geo.path()
    	.projection(projection);
        
    //use queue.js to parallelize asynchronous data loading
    d3_queue.queue()
        .defer(d3.json, "data/land.topojson") //load base map data
    	.defer(d3.json, "data/cntry1715.topojson") //load overlay spatial data of countries
    	.defer(d3.json, "data/cntry1783.topojson") //load overlay spatial data of countries
    	.defer(d3.json, "data/cntry1815.topojson") //load overlay spatial data of countries
        .await(callback);
        
	function callback(error, base, overlay1, overlay2, overlay3){
        console.log(error);
        console.log(base);
        
        //translate europe TopoJSON
        var landBase = topojson.feature(base, base.objects.ne_110m_land),
            countriesOverlay1 = topojson.feature(overlay1, overlay1.objects.cntry1715).features;
            countriesOverlay2 = topojson.feature(overlay2, overlay2.objects.cntry1783).features;
            countriesOverlay3 = topojson.feature(overlay3, overlay3.objects.cntry1815).features;
        
        //examine the results
        console.log(landBase);
        //examine the results
            
        //add France regions to map
        var countries_1715 = mapContainer.selectAll(".countries_1715")
            .data(countriesOverlay1)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "countries_1715 " + d.properties.name;
            })
            .attr("d", path);
            
        //add France regions to map
       //  var countries_1783 = mapContainer.selectAll(".countries_1783")
//             .data(countriesOverlay2)
//             .enter()
//             .append("path")
//             .attr("class", function(d){
//                 return "countries_1783 " + d.properties.name;
//             })
//             .attr("d", path);
            
        //add France regions to map
//         var countries_1815 = mapContainer.selectAll(".countries_1815")
//             .data(countriesOverlay3)
//             .enter()
//             .append("path")
//             .attr("class", function(d){
//                 return "countries_1815 " + d.properties.name;
//             })
//             .attr("d", path);    
          
             //add Europe countries to map
        var land = mapContainer.append("path")
            .datum(landBase)
            .attr("class", "land")
            .attr("d", path);
		
		//dropdown change listener handler
function changeAttribute(attribute){
    //change the expressed attribute
    expressed = attribute;
    console.log(expressed);
    if (expressed == attrArray[0]) {
    	console.log("hi")
    	//add France regions to map
        var expressed = mapContainer.selectAll("." + expressed)
            .data(countriesOverlay1)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "countries_1715 " + d.properties.name;
            })
            .attr("d", path);
    	}
    else if (expressed == attrArray[1]) {
    	console.log("hi")
    	//add France regions to map
        var expressed = mapContainer.selectAll("." + expressed)
            .data(countriesOverlay2)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "countries_1783 " + d.properties.name;
            })
            .attr("d", path);
    	}
    else {
    	console.log("hi")
    	var expressed = mapContainer.selectAll("." + expressed)
            .data(countriesOverlay3)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "countries_1815 " + d.properties.name;
            })
            .attr("d", path);    
    	
    	}
    	
        
};


//function to create a dropdown menu for attribute selection
function createDropdown(attrArray){
    //add select element
    var dropdown = d3.select("body")
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
		
		createDropdown(attrArray);
		 
	};
};






// set_projection(new Option("Mercator", "mercator", false, false));
// 
// function set_projection(option) {
//   proj = option.value
// 
//   projection = eval("d3.geo."+proj+"();");
// 
//   path = d3.geo.path()
//     .projection(projection);
// 
//   svg.countries_1715.selectAll("path").transition()
//       .duration(1000)
//        .attr("d", path);
// }
// 
// function projection_selected(e){
//   set_projection(e.target[e.target.selectedIndex])
// }
// 
// var newSelect = document.createElement("select");
// newSelect.id = "selectlistid"; // add some attributes
// newSelect.onchange = projection_selected; // call the somethingChanged function when a change is made
// newSelect[newSelect.length] = new Option("Aitoff","aitoff",false, false)
// newSelect[newSelect.length] = new Option("Albers equal-area conic","albers",false, false);
// newSelect[newSelect.length] = new Option("Armadillo","armadillo",false, false);
// newSelect[newSelect.length] = new Option("August conformal","august",false, false);
// newSelect[newSelect.length] = new Option("Lambert azimuthal equal-area","azimuthalEqualArea",false, false);
// newSelect[newSelect.length] = new Option("azimuthal equidistant","azimuthalEquidistant",false, false);
// newSelect[newSelect.length] = new Option("Baker Dinomic","baker",false, false);
// newSelect[newSelect.length] = new Option("Berghaus Star","berghaus",false, false);
// newSelect[newSelect.length] = new Option("Boggs eumorphic","boggs",false, false);
// newSelect[newSelect.length] = new Option("Bonne","bonne",false, false);
// 
// newSelect[newSelect.length] = new Option("Mercator","mercator",false, true);
// 
// //document.getElementById('myDiv').appendChild(newSelect); // myDiv is the container to hold the select list
// 

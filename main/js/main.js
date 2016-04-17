//load map
window.onload = setMap();

//set up map and call data
function setMap(){

	//map frame dimensions
    var width = 600,
        height = 400;

    //create new svg container for the map
    var mapContainer = d3.select("body")
        .append("svg")
        .attr("class", "mapContainer")
        .attr("width", width)
        .attr("height", height);

	var projection = d3.geo.robinson()
    	.scale(120)
    	.translate([width / 2, height / 2])
    	.precision(.1);
        
    var path = d3.geo.path()
        .projection(projection);
        
    //use queue.js to parallelize asynchronous data loading
    d3_queue.queue()
        .defer(d3.json, "data/land.topojson") //load base map data
    	.defer(d3.json, "data/worldCountries.topojson") //load overlay spatial data of countries
        .await(callback);
        
function callback(error, base, overlay){
        console.log(error);
        console.log(base);
        console.log(overlay);
        
        //translate europe TopoJSON
        var landBase = topojson.feature(base, base.objects.ne_110m_land),
            countriesOverlay = topojson.feature(overlay, overlay.objects.ne_110m_admin_0_countries).features;
        
        //examine the results
        console.log(landBase);
        //examine the results
        console.log(countriesOverlay);
            
        //add France regions to map
        var countries = mapContainer.selectAll(".countries")
            .data(countriesOverlay)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "countries " + d.properties.sovereignt;
            })
            .attr("d", path);
            
             //add Europe countries to map
        var land = mapContainer.append("path")
            .datum(landBase)
            .attr("class", "land")
            .attr("d", path);

    };
};
   var graph;
   var dataset;

   // load csv file and create the chart
   //d3.csv('enso_perf_roundup.csv', function(data) {
   //d3.csv('ENSO_perf_roundup_ERAinterim_20181001.csv', function(data) {
   //d3.csv('ENSO_perf_HadISST+Tropflux+ERAinterim_roundup_20181001.csv', function(data) {
   //d3.csv('ENSO_perf_ERAinterim+HadISST+Tropflux_20181009.csv', function(data) {
   d3.csv('mycsvfile.csv', function(data) {
       dataset = data;
       graph = d3.parcoords()('#wrapper')
           .data(data)
           .alpha(0.4)
           .mode("queue")
           .rate(5)
           .render()
           .interactive()
           .brushable()
           //.reorderable()

       change_color("NAM_DJF");

       graph.svg
           .selectAll(".dimension")
           .on("click", change_color);

       // create data table, row hover highlighting
       var grid = d3.divgrid();
       d3.select("#grid")
           .datum(data)
           .call(grid)
           .selectAll(".row")
           .on({
               //"mouseover": function(d) { graph.highlight([d]) },
               "click": function(d) { graph.highlight([d]) },
               //"mouseout": graph.unhighlight
           });

       // update data table on brush event
       graph.on("brush", function(d) {
           d3.select("#grid")
               .datum(d)
               .call(grid)
               .selectAll(".row")
               .on({
                   "mouseover": function(d) { graph.highlight([d]) },
                   "mouseout": graph.unhighlight
               });
       });

       // from http://bl.ocks.org/ABSegler/9791707
       graph.on("mouseover", function(d){
               //graph.highlight([d])
               d3.select(this).transition().duration(100)
                   .style({'stroke' : '#F00'});
               tooltip.text(d.name);
               return tooltip.style("visibility", "visible");
       });


/*
      // add hover event
      // adopted from here: http://bl.ocks.org/mostaphaRoudsari/b4e090bb50146d88aec4
      //d3.select("#wrapper svg")
      graph.svg
        .on("mousemove", function() {
            var mousePosition = d3.mouse(this);                     
            highlightLineOnClick(mousePosition, true); //true will also add tooltip
        })
        .on("mouseout", function(){
                cleanTooltip();
                graph.unhighlight();
        });
        
      });
*/
   });

   // Remove all but selected from the dataset
   d3.select("#keep-data")
       .on("click", function() {
           new_data = graph.brushed();
           if (new_data.length == 0) {
               alert("Please do not select all the data when keeping/excluding");
               return false;
           }
           callUpdate(new_data);
       });

   // Exclude selected from the dataset
   d3.select("#exclude-data")
       .on("click", function() {
           new_data = _.difference(dataset, graph.brushed());
           if (new_data.length == 0) {
               alert("Please do not select all the data when keeping/excluding");
               return false;
           }
           callUpdate(new_data);
       });

   // Reset dataset
   d3.select("#reset-data")
       .on("click", function() {
           callUpdate(dataset);
       });

   // Refresh page
   d3.select("#refresh-page")
       .on("click", function() {
           window.location.reload();
       });

   var color_scale = d3.scale.linear()
       .domain([-2, -0.5, 0.5, 2])
       //.range(["#DE5E60", "steelblue", "steelblue", "#98df8a"])
       .range(["red", "green", "blue", "purple"])
       .interpolate(d3.interpolateLab);

//   var color_scale = d3.scale.category20b()

   function change_color(dimension) {
       graph.svg.selectAll(".dimension")
           .style("font-weight", "normal")
           .filter(function(d) {
               return d == dimension;
           })
           .style("font-weight", "bold")

       graph.color(zcolor(graph.data(), dimension)).render()
   }

   function zcolor(col, dimension) {
       var z = zscore(_(col).pluck(dimension).map(parseFloat));
       return function(d) {
           return color_scale(z(d[dimension]))
       }
   };

   function zscore(col) {
       var n = col.length,
           mean = _(col).mean(),
           sigma = _(col).stdDeviation();

       return function(d) {
           return (d - mean) / sigma;
       };
   };

   function callUpdate(data) {
       graph.data(data).brush().render().updateAxes();

   }



// adopted from here: http://bl.ocks.org/mostaphaRoudsari/b4e090bb50146d88aec4

// Add highlight for every line on click
function getCentroids(data){
        // this function returns centroid points for data. I had to change the source
        // for parallelcoordinates and make compute_centroids public.
        // I assume this should be already somewhere in graph and I don't need to recalculate it
        // but I couldn't find it so I just wrote this for now
        var margins = graph.margin();
        var graphCentPts = [];
        
        data.forEach(function(d){
                
                var initCenPts = graph.compute_centroids(d).filter(function(d, i){return i%2==0;});
                
                // move points based on margins
                var cenPts = initCenPts.map(function(d){
                        return [d[0] + margins["left"], d[1]+ margins["top"]]; 
                });

                graphCentPts.push(cenPts);
        });

        return graphCentPts;
}

function getActiveData(){
        // I'm pretty sure this data is already somewhere in graph
        if (graph.brushed()!=false) return graph.brushed();
        return graph.data();
}

function getClickedLines(mouseClick){
    var clicked = [];
    var clickedCenPts = [];

    // find which data is activated right now
    var activeData = getActiveData();

    // find centriod points
    var graphCentPts = getCentroids(activeData);

    if (graphCentPts.length==0) return false;

    // find between which axes the point is
    var axeNum = findAxes(mouseClick, graphCentPts[0]);
    if (!axeNum) return false;

    graphCentPts.forEach(function(d, i){
            if (isOnLine(d[axeNum-1], d[axeNum], mouseClick, 2)){
                clicked.push(activeData[i]);
                clickedCenPts.push(graphCentPts[i]); // for tooltip
            }
        });

    return [clicked, clickedCenPts]
}

function highlightLineOnClick(mouseClick, drawTooltip){

    var clicked = [];
    var clickedCenPts = [];

    clickedData = getClickedLines(mouseClick);

    if (clickedData && clickedData[0].length!=0){

        clicked = clickedData[0];
        clickedCenPts = clickedData[1];

        // highlight clicked line
        graph.highlight(clicked);

        if (drawTooltip){
                // clean if anything is there
                cleanTooltip();
                // add tooltip
                addTooltip(clicked, clickedCenPts);
                }

        }
};


// set the dimensions and margins of the graph
let margin = { top: 30, right: 10, bottom: 10, left: 0 };
let width = 1600 - margin.left - margin.right;
let height = 900 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3
  .select("#my_dataviz")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Parse the Data
d3.csv("mycsvfile.csv", function(data) {
  // Extract the list of dimensions we want to keep in the plot. Here I keep all except the column called model_name
  console.log("data:", data);
  dimensions = d3.keys(data[0]).filter(function(d) {
    return d != "model_name";
  });
  model_name = data["model_name"];
  console.log("model_name:", model_name);
  console.log("dimensions:", dimensions);

  // For each dimension, I build a linear scale. I store all in a y object
  var y = {};
  for (i in dimensions) {
    console.log("i:", i);
    name = dimensions[i];
    console.log("name:", name);
    y[name] = d3
      .scaleLinear()
      .domain(
        // d3.extent Returns the minimum and maximum value in the given iterable using natural order
        d3.extent(data, function(d) {
          // +d[name] converts the value of d[name] to a number
          console.log("d[name]:", d[name]);
          return +d[name];
        })
      )
      .range([height, 0]);
  }
  console.log("y:", y);

  // Build the X scale -> it find the best position for each Y axis
  x = d3
    .scalePoint()
    .range([0, width])
    .padding(1)
    .domain(dimensions);

  console.log("x:", x);

  // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
  function path(d) {
    console.log("d in path function:", d);
    return d3.line()(
      dimensions.map(function(p) {
        console.log("p:", p);
        console.log(`${p} -> x(p) in path function:`, x(p));
        console.log(`${p} for y[p](d(p)) in path function:`, y[p](d[p]));
        return [x(p), y[p](d[p])];
      })
    );
  }

  let colorScale_3 = d3.scaleSequential(d3.interpolateViridis);

  // Draw the lines
  svg
    .selectAll("myPath")
    .data(data)
    .enter()
    .append("path")
    .attr("d", path)
    .style("fill", "none")
    .style("stroke", function(d, i) {
      return colorScale_3(i / data.length);
    })
    .style("opacity", 0.5)
    .attr("class", function(d) {
      return "coordinate_path " + d["model_name"];
    });

  svg
    .append("g")
    .attr("id", "scatter")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .selectAll(".dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("r", 6)
    .attr("cx", function(d) {
      // return xScale(d.x);
      return dimensions.map(function(p) {
        console.log("p:", p);
        console.log(`${p} -> x(p) in circle function:`, x(p));
        return x(p);
        // return [x(p), y[p](d[p])];
      });
      // console.log("d in cx:", d);
      // console.log("x(d) in circle:", x(d));
      // return x(d);
    })
    .attr("cy", function(d) {
      dimensions.map(function(p) {
        console.log(`${p} for y[p](d(p)) in circle function:`, y[p](d[p]));
        // console.log("y[p](d[p])")
        return y[p](d[p]);
      });
      // return yScale(d.y);
    })
    .attr("stroke", "white")
    .attr("stroke-width", "2px")
    .style("fill", "brown");

  // Draw the axis:
  svg
    .selectAll("myAxis")
    // For each dimension of the dataset I add a 'g' element:
    .data(dimensions)
    .enter()
    .append("g")
    // I translate this element to its right position on the x axis
    .attr("transform", function(d) {
      return "translate(" + x(d) + ")";
    })
    // And I build the axis with the call function
    .each(function(d) {
      d3.select(this).call(d3.axisLeft().scale(y[d]));
    })
    // Add axis title
    .append("text")
    .style("text-anchor", "middle")
    .attr("y", -9)
    .text(function(d) {
      return d;
    })
    .style("fill", "black");

  var grid = d3.divgrid();
  d3.select("#grid")
    .datum(data)
    .call(grid);
});

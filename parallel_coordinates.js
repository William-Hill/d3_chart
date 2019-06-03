import { parcoordsColors } from "./parcoords_colors.js";

// set the dimensions and margins of the graph
let margin = { top: 30, right: 10, bottom: 10, left: 0 };

var parentDiv = document.getElementById("my_dataviz");
let width = parentDiv.clientWidth;
let height = document.body.clientHeight;

console.log("width:", width);
console.log("height:", height);

// append the svg object to the body of the page
var svg = d3
  .select("#my_dataviz")
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%")
  .attr("preserveAspectRatio", "xMinYMin")
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

function calculateDomain(data, name) {
  // d3.extent Returns the minimum and maximum value in the given iterable using natural order
  return d3.extent(data, function(d) {
    // +d[name] converts the value of d[name] to a number
    return +d[name];
  });
}

// Parse the Data
d3.csv("mycsvfile.csv", function(data) {
  // Extract the list of dimensions we want to keep in the plot. Here I keep all except the column called model_name
  console.log("data:", data);
  const dimensions = d3.keys(data[0]).filter(function(d) {
    return d != "model_name";
  });
  console.log("dimensions:", dimensions);

  const model_names = data.map(d => d["model_name"]);

  let colorScale = d3
    .scaleOrdinal()
    .domain(model_names)
    .range(parcoordsColors);

  // For each dimension, I build a linear scale. I store all in a y object
  var y = {};
  for (let i in dimensions) {
    name = dimensions[i];
    y[name] = d3
      .scaleLinear()
      .domain(calculateDomain(data, name))
      .range([height * 0.6, 0]);
  }
  console.log("y:", y);

  // Build the X scale -> it find the best position for each Y axisLeft

  let x = d3
    .scalePoint()
    .range([0, parentDiv.clientWidth])
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
    .attr("class", function(d) {
      return "path_regular coordinate_path " + d["model_name"];
    });

  function plotPoints(data) {
    for (let row in data) {
      if (!isNaN(row)) {
        calculatePoint(data[row]);
      }
    }
  }

  let symbolScale = d3.scaleOrdinal(d3.symbols);
  // creates a generator for symbols
  var symbol = d3.symbol().size(100);

  function calculatePoint(row) {
    let row_model_name = row["model_name"];
    for (const [variable, value] of Object.entries(row)) {
      if (variable == "model_name") {
        continue;
      }
      let xPoint = x(variable);
      let yPoint = y[variable](value);

      svg
        .append("path")
        .attr("class", "symbol")
        .attr("d", function(d, i) {
          return symbol.type(symbolScale(row_model_name))();
        })
        .style("fill", function(d) {
          return colorScale(row_model_name);
        })
        .attr("transform", function(d) {
          return "translate(" + xPoint + "," + yPoint + ")";
        });
    }
  }

  plotPoints(data);

  let legend = d3.select("#legendColumns");

  let pointRadius = 50;

  model_names.forEach(function(d, i) {
    var x = pointRadius + 10;
    var y = 23 + i * 20;
    console.log("model names d:", d);
    legend
      .append("div")
      .attr("class", "column is-one-quarter")
      .style("height", "8%")
      .attr("id", "column_" + d);

    let legendColumn = d3.select("#column_" + d);
    legendColumn
      .append("svg")
      .attr("class", "legendKey_" + d)
      .attr("width", "100%")
      .attr("height", "100%");

    var clientHeight = document.getElementById("column_" + d).clientHeight;
    let symbolXCoord = +legendColumn.style("width").slice(0, -2) * 0.1;
    let symbolYCoord =
      +document.getElementById("column_" + d).clientHeight * 0.4;
    var symbol = d3
      .symbol()
      .type(symbolScale(d))
      .size(pointRadius);

    let legendSvg = d3.select(".legendKey_" + d);

    legendSvg
      .append("path")
      .attr("d", symbol)
      .attr("fill", colorScale(d))
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("transform", `translate(${symbolXCoord}, ${symbolYCoord})`);

    legendSvg
      .append("text")
      .attr("class", "legend")
      .attr("x", symbolXCoord + 15)
      .attr("y", symbolYCoord)
      .attr("dominant-baseline", "central")
      .style("font-size", "0.75em")
      .text(d);
  });

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

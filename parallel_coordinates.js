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

/**
 * @description Gets the list of climate variables from the dataset
 * @param data An object representing the dataset that was parsed by D3.
 * @returns array - An Array containing the Variable names
 */
function getVariables(data) {
  const variables = d3.keys(data[0]).filter(function(d) {
    return d != "model_name";
  });

  return variables;
}

/**
 * @description Create an ordinal scale to map climate models to unique colors
 * @param model_names An array of model names from the dataset
 * @returns d3 Ordinal scale - An ordinal scale that will map to colors
 */
function createColorScale(model_names) {
  return d3
    .scaleOrdinal()
    .domain(model_names)
    .range(parcoordsColors);
}

/**
 * @description Create an object with each climate variable as a key and a linear scale to calculate y axis position as a value
 * @param variables An Array containing the Variable names
 * @param data An object representing the dataset that was parsed by D3.
 * @param height The height of the SVG container
 * @returns Object - An object with climate variables and its associated linear scale as key:value pairs
 */
function createValueScale(variables, data, height) {
  let valueScale = {};
  for (let i in variables) {
    name = variables[i];
    valueScale[name] = d3
      .scaleLinear()
      .domain(calculateDomain(data, name))
      .range([height * 0.6, 0]);
  }
  return valueScale;
}

/**
 * @description Create a scale to map climate variable names to a point between 0 and the width of the SVG container
 * @param variables An Array containing the Variable names
 * @param height The width of the SVG container
 * @returns Object - A d3 scale
 */
function createModelScale(variables, width) {
  return d3
    .scalePoint()
    .range([0, width])
    .padding(1)
    .domain(variables);
}

/**
 * @description Plots the symbols on the Parallel Coordinate visualization
 * @param data An object representing the dataset that was parsed by D3.
 * @param x A d3 scale to map climate variable names to a point between 0 and the width of the SVG container
 * @param y an object with each climate variable as a key and a linear scale to calculate y axis position as a value
 * @param symbolScale an ordinal scale to map climate models to a d3 shape
 * @param colorScale an ordinal scale to map climate models to unique colors
 */
function plotSymbols(data, x, y, symbolScale, colorScale) {
  for (let row in data) {
    if (!isNaN(row)) {
      calculatePoint(data[row], x, y, symbolScale, colorScale);
    }
  }
}

/**
 * @description Calculate the position of a symbol on the Parallel Coordinate visualization
 * @param row An object representing a row of the dataset that was parsed by D3.
 * @param x A d3 scale to map climate variable names to a point between 0 and the width of the SVG container
 * @param y an object with each climate variable as a key and a linear scale to calculate y axis position as a value
 * @param symbolScale an ordinal scale to map climate models to a d3 shape
 * @param colorScale an ordinal scale to map climate models to unique colors
 */
function calculatePoint(row, x, y, symbolScale, colorScale) {
  let row_model_name = row["model_name"];
  for (const [variable, value] of Object.entries(row)) {
    if (variable == "model_name") {
      continue;
    }
    let xPoint = x(variable);
    let yPoint = y[variable](value);
    // creates a generator for symbols
    var symbol = d3.symbol().size(100);

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

/**
 * @description Create a legend to show the symbol:model pairings
 * @param model_names An array of model names from the dataset
 * @param symbolScale an ordinal scale to map climate models to a d3 shape
 * @param colorScale an ordinal scale to map climate models to unique colors
 */
function createLegend(model_names, symbolScale, colorScale) {
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
    var legendSymbol = d3
      .symbol()
      .type(symbolScale(d))
      .size(pointRadius);

    let legendSvg = d3.select(".legendKey_" + d);

    legendSvg
      .append("path")
      .attr("d", legendSymbol)
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
}

/**
 * @description Draw a SVG path for each climate model's values
 * @param data An object representing the dataset that was parsed by D3.
 * @param calculatePath a callback function to calculate a SVG path through the values of each Variable of a climate model
 */
function drawCoordinateLines(data, calculatePath) {
  // Draw the lines
  let colorScale_3 = d3.scaleSequential(d3.interpolateViridis);
  svg
    .selectAll("myPath")
    .data(data)
    .enter()
    .append("path")
    .attr("d", calculatePath)
    .style("fill", "none")
    .style("stroke", function(d, i) {
      return colorScale_3(i / data.length);
    })
    .attr("class", function(d) {
      return "path_regular coordinate_path " + d["model_name"];
    });
}

/**
 * @description Create a text data table for the dataset
 * @param data An object representing the dataset that was parsed by D3.
 */
function createTable(data) {
  let grid = d3.divgrid();
  d3.select("#grid")
    .datum(data)
    .call(grid);
}

/**
 * @description Draw the axes for the Parallel Coordinate visualization
 * @param variables An Array containing the Variable names
 * @param x A d3 scale to map climate variable names to a point between 0 and the width of the SVG container
 * @param y an object with each climate variable as a key and a linear scale to calculate y axis position as a value
 */
function drawAxis(variables, x, y) {
  // Draw the axis:
  svg
    .selectAll("myAxis")
    // For each dimension of the dataset I add a 'g' element:
    .data(variables)
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
}

// Parse the Data
d3.csv("csv_files/test.csv", function(data) {
  // Extract the list of variables we want to keep in the plot. Here I keep all except the column called model_name
  console.log("data:", data);
  const variables = getVariables(data);

  const model_names = data.map(d => d["model_name"]);

  let colorScale = createColorScale(model_names);

  // For each dimension, I build a linear scale. I store all in a y object
  let y = createValueScale(variables, data, height);
  console.log("y:", y);

  // Build the X scale -> it find the best position for each Y axisLeft
  let x = createModelScale(variables, parentDiv.clientWidth);
  console.log("x:", x);

  // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
  function calculatePath(row) {
    console.log("row in path function:", row);
    return d3.line()(
      variables.map(function(variable) {
        console.log("variable:", variable);
        console.log(
          `${variable} -> x(variable) in path function:`,
          x(variable)
        );
        let variableValue = row[variable];
        console.log(
          `${variable} for y[variable](variableValue) in path function:`,
          y[variable](variableValue)
        );
        return [x(variable), y[variable](variableValue)];
      })
    );
  }

  drawCoordinateLines(data, calculatePath);

  let symbolScale = d3.scaleOrdinal(d3.symbols);

  plotSymbols(data, x, y, symbolScale, colorScale);
  createLegend(model_names, symbolScale, colorScale);

  drawAxis(variables, x, y);

  createTable(data);
});

import { parcoordsColors } from "./parcoords_colors.js";

// set the dimensions and margins of the graph
let margin = { top: 30, right: 10, bottom: 10, left: -35 };

var parentDiv = document.getElementById("my_dataviz");
let width = parentDiv.clientWidth;
let height = document.body.clientHeight;

var svgParentDiv = document.getElementById("parallel_coords_div");
let svgWidth = svgParentDiv.clientWidth;
let svgHeight = svgParentDiv.clientHeight;
// append the svg object to the body of the page
let svg = d3
  .select("#parallel_coords_div")
  .append("svg")
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", "0 0 " + svgWidth + " " + svgHeight)
  .classed("svg-content", true)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// TODO: Cache initial domain and inital coordinate_paths to speed up
// TODO: synchronize table with char
// TODO: look at react integration
function setStaticScale(data, variables, scaleType, lowerBound, upperBound) {
  let valueScale = {};
  let domainValue;
  for (let i in variables) {
    let name = variables[i];
    if (scaleType == "custom") {
      domainValue = [lowerBound, upperBound];
    } else {
      domainValue = calculateDomain(data, name);
    }
    valueScale[name] = d3
      .scaleLinear()
      .domain(domainValue)
      .range([height * 0.6, 0]);
  }
  return valueScale;
}

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
  let symbolSelection = d3.selectAll(".symbol");
  if (!symbolSelection.empty()) {
    symbolSelection.remove();
  }
  for (let row in data) {
    if (!isNaN(row)) {
      calculatePoint(data[row], x, y, symbolScale, colorScale);
    }
  }
}

/**
 * @description Displays a tooltip with the model name and value when a symbol is moused over
 * @param symbolDOMElement The symbol SVG element in the DOM
 */
function showTooltip(symbolDOMElement) {
  tooltipDiv
    .transition()
    .duration(200)
    .style("opacity", 0.9);
  tooltipDiv
    .html(
      symbolDOMElement.dataset.model_name +
        "<br/>" +
        symbolDOMElement.dataset.value
    )
    .style("left", d3.event.pageX + "px")
    .style("top", d3.event.pageY - 28 + "px");
}

/**
 * @description Hides a tooltip moused out of a symbol
 */
function hideTooltip() {
  tooltipDiv
    .transition()
    .duration(500)
    .style("opacity", 0);
}

/**
 * @description Toggles the display of the SVG path for each climate model's values
 * @param symbolDOMElement The symbol SVG element in the DOM
 */
function togglePathHighlight(symbolDOMElement, colorScale) {
  let path = d3.select("path." + symbolDOMElement.dataset.model_name);
  if (path.classed("path_highlight")) {
    path.classed("path_highlight", false);
    path.classed("path_regular", true);
  } else {
    path.classed("path_highlight", true);
    path.classed("path_regular", false);
  }

  let tableRow = d3.select(".row." + symbolDOMElement.dataset.model_name);
  if (tableRow.classed("row_highlight")) {
    tableRow.classed("row_highlight", false);
    tableRow.style("background", "none").style("color", "#4a4a4a");
  } else {
    tableRow.classed("row_highlight", true);
    let modelName = symbolDOMElement.dataset.model_name;
    tableRow.style("background-color", colorScale(modelName));
    tableRow.style("color", "#deffffff");
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
      })
      .attr("data-model_name", row_model_name)
      .attr("data-value", value)
      .attr("data-variable", variable)
      .on("mouseover", function(d) {
        showTooltip(this);
      })
      .on("mouseout", hideTooltip)
      .on("click", function(d) {
        togglePathHighlight(this, colorScale);
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
  let legendColumnsSelection = d3.selectAll("#legendColumns .column");
  if (!legendColumnsSelection.empty()) {
    legendColumnsSelection.remove();
  }

  let legend = d3.select("#legendColumns");

  let pointRadius = 35;
  model_names.sort(function(a, b) {
    return a.localeCompare(b, "en", { sensitivity: "base" });
  });
  model_names.forEach(function(d, i) {
    var x = pointRadius + 10;
    var y = 23 + i * 20;
    legend
      .append("div")
      .attr(
        "class",
        "column is-one-quarter-desktop is-one-quarter-widescreen is-one-third-touch"
      )
      .style("height", "9%")
      .attr("id", "column_" + d);

    let legendColumn = d3.select("#column_" + d);
    legendColumn
      .append("div")
      .attr("class", "columns is-mobile")
      .attr("id", `${d}_legend`);

    let modelLegend = d3.select(`#${d}_legend`);
    modelLegend
      .append("div")
      .attr("class", "column is-one-third has-text-centered is-vcentered")
      .attr("id", `${d}_symbol_column`);
    modelLegend
      .append("div")
      .attr("class", "column has-text-centered is-vcentered")
      .attr("id", `${d}_model_name_column`);
    let symbolColumn = d3.select(`#${d}_symbol_column`);
    symbolColumn
      .append("svg")
      .attr("class", "legendKey_" + d)
      .attr("width", "100%")
      .attr("height", "100%");

    var clientHeight = document.getElementById("column_" + d).clientHeight;
    let symbolXCoord = +legendColumn.style("width").slice(0, -2) * 0.1;
    let symbolYCoord =
      +document.getElementById("column_" + d).clientHeight * 0.2;
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

    let modelNameColumn = d3.select(`#${d}_model_name_column`);
    modelNameColumn
      .append("p")
      .attr("class", "is-size-7-desktop is-size-7-touch")
      .text(d);
  });
}

/**
 * @description Draw a SVG path for each climate model's values
 * @param data An object representing the dataset that was parsed by D3.
 * @param calculatePath a callback function to calculate a SVG path through the values of each Variable of a climate model
 */
function drawCoordinateLines(data, calculatePath, variables, x, y, colorScale) {
  // Draw the lines
  let pathSelection = d3.selectAll(".coordinate_path");
  if (!pathSelection.empty()) {
    pathSelection.remove();
  }

  let paths = svg.selectAll(".coordinate_path").data(data);
  paths
    .enter()
    .append("path")
    .attr("d", function(d) {
      return calculatePath(d, variables, x, y);
    })
    .style("fill", "none")
    .style("stroke", function(d, i) {
      return colorScale(d.model_name);
    })
    .attr("class", function(d) {
      return "path_regular coordinate_path " + d["model_name"];
    });
}

/**
 * @description A custom sorting function for sorting an array of climate data objects by model_name
 */
function compare(a, b) {
  // Use toUpperCase() to ignore character casing
  const model_nameA = a.model_name.toUpperCase();
  const model_nameB = b.model_name.toUpperCase();

  let comparison = 0;
  if (model_nameA > model_nameB) {
    comparison = 1;
  } else if (model_nameA < model_nameB) {
    comparison = -1;
  }
  return comparison;
}

/**
 * @description Create a text data table for the dataset
 * @param data An object representing the dataset that was parsed by D3.
 */
function createTable(data, colorScale) {
  data.sort(compare);
  d3.select("#grid")
    .selectAll("*")
    .remove();

  let grid = d3.divgrid({ colorScale: colorScale });
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
  let axisSelection = d3.selectAll(".axis");
  if (!axisSelection.empty()) {
    axisSelection.remove();
  }
  // Draw the axis:
  let axis = svg.selectAll(".axis").data(variables);

  axis
    .enter()
    .append("g")
    .attr("class", "y axis")
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
    .style("font-size", "1.25em")
    .style("font-weight", "bold")
    .style("fill", "black");
}

// The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
function calculatePath(row, variables, x, y) {
  return d3.line()(
    variables.map(function(variable) {
      let variableValue = row[variable];
      return [x(variable), y[variable](variableValue)];
    })
  );
}

function updateAxis(variables, x, y) {
  var t = d3.transition().duration(1000);

  svg.selectAll(".y").each(function(d) {
    d3.select(this)
      .transition()
      .duration(1500)
      .call(d3.axisLeft().scale(y[d]));
  });
  d3.selectAll(".symbol").each(function() {
    let xPoint = x(this.dataset.variable);
    let yPoint = y[this.dataset.variable](this.dataset.value);
    d3.select(this)
      .transition()
      .duration(1500)
      .attr("transform", function(d) {
        return "translate(" + xPoint + "," + yPoint + ")";
      });
  });
  d3.selectAll(".coordinate_path").each(function() {
    d3.select(this)
      .transition()
      .duration(1500)
      .attr("d", function(d) {
        return calculatePath(d, variables, x, y);
      });
  });
}

function addScaleEventHandlers(data, variables, x, y) {
  let customScaleButton = document.getElementById("updateScaleButton");

  customScaleButton.addEventListener("click", function() {
    let values = slider.noUiSlider.get();
    y = setStaticScale(data, variables, "custom", values[0], values[1]);
    updateAxis(variables, x, y);
  });

  let customScaleCheckbox = d3.select("#customScaleToggle");

  customScaleCheckbox.on("change", function() {
    if (this.checked) {
      slider.removeAttribute("disabled");
      customScaleButton.disabled = false;
    } else {
      slider.setAttribute("disabled", true);
      customScaleButton.disabled = true;
      y = setStaticScale(data, variables, "static");
      updateAxis(variables, x, y);
    }
  });
}

function updateSliderRange(minValue, maxValue) {
  slider.noUiSlider.updateOptions({
    start: [minValue, maxValue],
    range: {
      min: minValue,
      max: maxValue
    }
  });
}

function findAbsoluteMinMax(data, variables) {
  let domainValues = [];
  for (let i in variables) {
    name = variables[i];
    domainValues.push(...calculateDomain(data, name));
  }
  return d3.extent(domainValues);
}

function updateChart(data_file_name) {
  // Parse the Data
  d3.csv(data_file_name, function(data) {
    // Extract the list of variables we want to keep in the plot. Here I keep all except the column called model_name
    const variables = getVariables(data);

    const model_names = data.map(d => d["model_name"]);

    let colorScale = createColorScale(model_names);

    // For each dimension, I build a linear scale. I store all in a y object
    let y = createValueScale(variables, data, height);

    // Build the X scale -> it find the best position for each Y axisLeft
    let x = createModelScale(variables, svgWidth);

    slider.setAttribute("disabled", true);
    let [minValue, maxValue] = findAbsoluteMinMax(data, variables);
    updateSliderRange(minValue, maxValue);
    addScaleEventHandlers(data, variables, x, y);

    drawCoordinateLines(data, calculatePath, variables, x, y, colorScale);

    let symbolScale = d3.scaleOrdinal(d3.symbols);

    plotSymbols(data, x, y, symbolScale, colorScale);
    createLegend(model_names, symbolScale, colorScale);

    drawAxis(variables, x, y);

    createTable(data, colorScale);
  });
}

// Define the div for the tooltip
let tooltipDiv = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

let slider = document.getElementById("slider");

noUiSlider.create(slider, {
  start: [0, 30],
  tooltips: [true, true],
  connect: true,
  range: {
    min: -100,
    max: 100
  }
});

let default_file = "All_Seasons-pr-cmip5-global-bias_xy.csv";
let data_file_name = `/static/mean_climate_json_files/cmip5_csv/${default_file}`;

update_plot_title();
updateChart(data_file_name);

let selector_form = document.getElementById("selector_form");

selector_form.onsubmit = generate_csv;

function handleErrors(response) {
  if (!response.ok) throw Error(response.statusText);
  return response;
}

function chooseAPIEndpoint() {
  let level = document.querySelector('input[name="level"]:checked').value;
  let urlEndpoint;
  if (level == "plotAllSeasonsByVariable") {
    urlEndpoint = "/plot_by_variable";
  } else {
    urlEndpoint = "/plot_by_season";
  }

  return urlEndpoint;
}

function update_plot_title() {
  let model_generation = document.getElementById("model_generation");
  var model_generation_value =
    model_generation.options[model_generation.selectedIndex].value;

  let region = document.getElementById("region_selector");
  var region_value = region.options[region.selectedIndex].value;

  let statistic = document.getElementById("statistic_selector");
  var statistic_value = statistic.options[statistic.selectedIndex].value;

  let level = document.querySelector('input[name="level"]:checked').value;
  let plot_title_string;
  if (level == "plotAllSeasonsByVariable") {
    let variable = document.getElementById("variable_selector");
    let variable_value = variable.options[variable.selectedIndex].value;

    plot_title_string = `All Seasons for ${variable_value} ${region_value} ${statistic_value}  (${model_generation_value})`;
  } else {
    let season = document.getElementById("season_selector");
    let season_value = season.options[season.selectedIndex].value;

    plot_title_string = `All Variables for ${season_value} ${region_value} ${statistic_value}  (${model_generation_value})`;
  }
  var plot_title = document.getElementById("plot_title");
  plot_title.innerHTML = plot_title_string;
}

function generate_csv() {
  var formElement = document.getElementById("selector_form");
  let data = {};
  for (var i = 0; i < formElement.elements.length; i++) {
    if (
      formElement.elements[i]["tagName"] == "SELECT" &&
      !formElement.elements[i].disabled
    ) {
      let name = formElement.elements[i]["name"];
      let value = formElement.elements[i]["value"];
      data[name] = value;
    }
  }
  let urlEndpoint = chooseAPIEndpoint();

  fetch(urlEndpoint, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(handleErrors)
    .then(() => {
      let url = new URL("/newest_file", window.location.href);
      var params = { model_generation: data["model_generation"] };
      url.search = new URLSearchParams(params);
      return fetch(url);
    })
    .then(response => response.json())
    .then(data => {
      update_plot_title();
      let modelGenerationSelector = document.getElementById("model_generation");
      let modelGeneration =
        modelGenerationSelector.options[modelGenerationSelector.selectedIndex]
          .value;
      let data_file_name = `/static/mean_climate_json_files/${modelGeneration}_csv/${
        data["latestfile"]
      }`;
      updateChart(data_file_name);
      bulmaToast.toast({
        message: `Created csv file for ${data["latestfile"]}`,
        duration: 4000,
        type: "is-success",
        position: "bottom-center",
        animate: { in: "fadeIn", out: "fadeOut" }
      });
    })
    .catch(error => {
      bulmaToast.toast({
        message: `Error creating csv file: ${error}`,
        duration: 4000,
        type: "is-danger",
        position: "bottom-center",
        animate: { in: "fadeIn", out: "fadeOut" }
      });
      console.error("Error:", error);
    });
  return false;
}

function hideSelectorDisplay(selectorType) {
  let label = document.getElementById(`${selectorType}_label`);
  let selectorDiv = document.getElementById(`${selectorType}_selector_div`);
  let selector = document.getElementById(`${selectorType}_selector`);
  selector.disabled = true;
  label.classList.add("hide");
  selectorDiv.classList.add("hide");
}

function showSelectorDisplay(selectorType) {
  let label = document.getElementById(`${selectorType}_label`);
  let selectorDiv = document.getElementById(`${selectorType}_selector_div`);
  let selector = document.getElementById(`${selectorType}_selector`);
  selector.disabled = false;
  label.classList.remove("hide");
  selectorDiv.classList.remove("hide");
}

function addLevelEventHandler() {
  for (
    var radioCounter = 0;
    radioCounter < document.getElementsByName("level").length;
    radioCounter++
  ) {
    document.getElementsByName("level")[radioCounter].onclick = function() {
      if (this.value == "plotAllSeasonsByVariable") {
        hideSelectorDisplay("season");
        showSelectorDisplay("variable");
      } else {
        hideSelectorDisplay("variable");
        showSelectorDisplay("season");
      }
    };
  }
}

addLevelEventHandler();

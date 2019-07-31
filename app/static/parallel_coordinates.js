import { parcoordsColors } from "./parcoords_colors.js";

// set the dimensions and margins of the graph
let margin = { top: 30, right: 10, bottom: 10, left: 0 };

var parentDiv = document.getElementById("my_dataviz");
let width = parentDiv.clientWidth;
let height = document.body.clientHeight;

// append the svg object to the body of the page
let svg = d3
    .select("#my_dataviz")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("preserveAspectRatio", "xMinYMin")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// TODO: Cache initial domain and inital coordinate_paths to speed up
// TODO: synchronize table with char
// TODO: look at react integration
function setStaticScale(data, variables, scaleType, lowerBound, upperBound) {
    let valueScale = {};
    let domainValue;
    for (let i in variables) {
        name = variables[i];
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

    let pointRadius = 25;

    model_names.forEach(function(d, i) {
        var x = pointRadius + 10;
        var y = 23 + i * 20;
        legend
            .append("div")
            .attr("class", "column is-one-quarter-desktop is-one-third-widescreen")
            .style("height", "9%")
            .attr("id", "column_" + d);

        let legendColumn = d3.select("#column_" + d);
        legendColumn
            .append("svg")
            .attr("class", "legendKey_" + d)
            .attr("width", "100%")
            .attr("height", "100%");

        var clientHeight = document.getElementById("column_" + d).clientHeight;
        let symbolXCoord = +legendColumn.style("width").slice(0, -2) * 0.1;
        let symbolYCoord = +document.getElementById("column_" + d).clientHeight * 0.4;
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
            .style("font-size", "0.5rem")
            // .style("font-size", "0.75em")
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
 * @description Create a text data table for the dataset
 * @param data An object representing the dataset that was parsed by D3.
 */
function createTable(data) {
    d3.select("#grid")
        .selectAll("*")
        .remove();

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
        .style("fill", "black");
}

function uploadFile() {
    console.log("inside uploadFile");
    var file = document.getElementById("file_uploader");
    file.onchange = function() {
        if (file.files.length > 0) {
            document.getElementById("file_name_span").innerHTML = file.files[0].name;
        }
    };
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

    let customScaleCheckbox = d3.selectAll("input");

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
        let x = createModelScale(variables, parentDiv.clientWidth);

        slider.setAttribute("disabled", true);

        addScaleEventHandlers(data, variables, x, y);

        drawCoordinateLines(data, calculatePath, variables, x, y, colorScale);

        let symbolScale = d3.scaleOrdinal(d3.symbols);

        plotSymbols(data, x, y, symbolScale, colorScale);
        createLegend(model_names, symbolScale, colorScale);

        drawAxis(variables, x, y);

        createTable(data);
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
    start: [0, 4],
    tooltips: [true, true],
    connect: true,
    range: {
        min: 0,
        max: 20
    }
});

var file = document.getElementById("file_uploader");
file.onchange = function() {
    console.log("filename changed");
    if (file.files.length > 0) {
        document.getElementById("file_name_span").innerHTML = file.files[0].name;
    }
};

// let data_file_name = "csv_files/test.csv";
let file_selector = d3.select("#file_selector");
let default_file_name = file_selector.property("options")[0].innerText;
let data_file_name = `/static/mean_climate_json_files/${default_file_name}`;

updateChart(data_file_name);

file_selector.on("change", function() {
    var value = this.options[this.selectedIndex].value;
    data_file_name = `/static/mean_climate_json_files/${value}`;
    updateChart(data_file_name);
});

let selector_form = document.getElementById("selector_form")

selector_form.onsubmit = generate_csv

function generate_csv() {
    console.log("generate_csv")
    return false
}
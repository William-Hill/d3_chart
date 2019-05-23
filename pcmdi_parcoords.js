// var blue_to_brown = d3
//   .scaleLinear()
//   .domain([9, 50])
//   .range(["steelblue", "brown"])
//   .interpolate(d3.interpolateLab);

// var color = function(d) {
//   console.log("color d:", d);
//   return blue_to_brown(d["model_name"]);
// };
let margin = { top: 30, right: 10, bottom: 10, left: 10 };

var width =
  window.innerWidth ||
  document.documentElement.clientWidth ||
  document.body.clientWidth;

var height =
  window.innerHeight ||
  document.documentElement.clientHeight ||
  document.body.clientHeight;

console.log("width:", width);
console.log("height:", 900);

var parcoords = ParCoords()("#example")
  .height(900)
  .width(width * 0.8);
// .color(color)
// .alpha(0.4);
// load csv file and create the chart
d3.csv("mycsvfile.csv").then(function(data) {
  console.log("data:", data);
  let modelNames = data.map(x => x["model_name"]);
  // let modelNames = d3.keys(data).filter(function(d) {
  //   console.log("d:", d);
  //   // console.log("type d", typeof d);
  //   return data[d]["model_name"];
  // });

  let colorRange = [
    "#045e0f",
    "#2611fe",
    "#9c0b55",
    "#105578",
    "#140173",
    "#74450a",
    "#39121d",
    "#0a250d",
    "#a01507",
    "#673f80",
    "#7112c6",
    "#8f0990",
    "#863637",
    "#584e44",
    "#161c43",
    "#2448ae",
    "#4f5405",
    "#105a4b",
    "#72405b",
    "#203ccd",
    "#3e023c",
    "#06165e",
    "#152128",
    "#a20332",
    "#314e8f",
    "#892872",
    "#69359e",
    "#2f1b03",
    "#1131e6",
    "#41562d",
    "#524d62",
    "#8b3502",
    "#5f4e26",
    "#31565a",
    "#460405",
    "#6f4636",
    "#942922",
    "#7522ae",
    "#863254",
    "#085d2c",
    "#600dde",
    "#544978",
    "#463db6",
    "#2e172f",
    "#2d025e",
    "#843a20",
    "#783288",
    "#375902",
    "#4c4596",
    "#405544",
    "#634d07",
    "#202015",
    "#96233f",
    "#6a464c",
    "#400729",
    "#291249",
    "#79396a",
    "#5330c6",
    "#97116b",
    "#1b5287",
    "#1e2202",
    "#4e5335",
    "#892280",
    "#052422",
    "#271c22",
    "#7c3c4d",
    "#882d63",
    "#05203c",
    "#311916",
    "#3c581c",
    "#0f5c3c",
    "#784227",
    "#54521d",
    "#7a3f3e",
    "#360f36",
    "#4a5153",
    "#6d481e",
    "#3a5269",
    "#320750",
    "#091b50",
    "#643d8f",
    "#684271",
    "#4f3fa6",
    "#514787",
    "#224c9e",
    "#793579",
    "#7d2697",
    "#5425d6",
    "#a4011b",
    "#2f24ee",
    "#5301ee",
    "#30583c",
    "#285b1b",
    "#6432ae",
    "#922a31",
    "#440517",
    "#7f07b6",
    "#952905",
    "#93244e",
    "#484e71",
    "#594d53",
    "#3c110f",
    "#211d2f",
    "#5d4869",
    "#893146",
    "#634b36",
    "#0a595a",
    "#1d5669",
    "#2d5a2d",
    "#a00640",
    "#64475b",
    "#803e0c",
    "#950181"
  ];
  var blue_to_brown = d3
    .scaleLinear()
    .domain(modelNames)
    .range(["steelblue", "brown"])
    .interpolate(d3.interpolateLab);

  let colorScale_3 = d3.scaleSequential(d3.interpolateInferno);
  let colorScale_2 = d3
    .scaleOrdinal()
    .domain(modelNames)
    .range(colorRange);
  let selectedModels = [];

  console.log("modelNames:", modelNames);
  parcoords
    .data(data)
    .color(function(d, i) {
      // console.log("color d now:", d);
      // console.log("i in color:", i);
      console.log(
        "colorScale_3(i / data.length):",
        colorScale_3(i / data.length)
      );
      console.log("colorScale_2:", colorScale_2(d["model_name"]));
      return colorScale_2(d["model_name"]);
      // return colorScale_3(i / data.length);
      // return blue_to_brown(d["model_name"]);
    })
    .alpha(0.4)
    .hideAxis(["name"])
    .render()
    .brushMode("1D-axes"); // enable brushing
  // create data table, row hover highlighting
  var grid = d3.divgrid();
  d3.select("#grid")
    .datum(data)
    .call(grid);
  var rows = d3.select("#grid").selectAll(".row");
  rows.on("click", function(d) {
    console.log("d on click:", d);
    if (selectedModels.includes(d)) {
      selectedModels = selectedModels.filter(model => model != d);
    } else {
      selectedModels.push(d);
    }
    if (!selectedModels || !selectedModels.length) {
      parcoords.unhighlight();
    } else {
      parcoords.highlight(selectedModels);
    }
    let clickedRow = d3.select(this);
    clickedRow.classed("row_highlight", !clickedRow.classed("row_highlight"));
  });
  rows.on("dblclick", function(d) {
    parcoords.unhighlight([d]);
  });
  // update data table on brush event
  parcoords.on("brush", function(d) {
    d3.select("#grid")
      .datum(d.slice(0, 10))
      .call(grid)
      .selectAll(".row")
      .on({
        mouseover: function(d) {
          parcoords.highlight([d]);
        },
        mouseout: parcoords.unhighlight
      });
  });
});

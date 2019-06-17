d3.divgrid = function(config) {
  var columns = [];
  let active;

  function reset() {
    console.log("inside reset");
    d3.selectAll(".row").classed("highlight", (highlight = false));
    // g.transition().duration(750).attr("transform", "");
  }

  function togglePathHighlight(d) {
    let path = d3.select("path." + d["model_name"]);
    if (path.classed("path_highlight")) {
      path.classed("path_highlight", false);
      path.classed("path_regular", true);
    } else {
      path.classed("path_highlight", true);
      path.classed("path_regular", false);
    }
  }

  function rowClicked(d, i) {
    togglePathHighlight(d);
    let clickedRow = d3.select(this);
    clickedRow.classed("highlight", !clickedRow.classed("highlight"));
  }

  var dg = function(selection) {
    if (columns.length == 0) columns = d3.keys(selection.data()[0][0]);

    // header
    selection
      .selectAll(".header")
      .data([true])
      .enter()
      .append("div")
      .attr("class", "columns header");

    var header = selection
      .select(".header")
      .selectAll(".columns")
      .data(columns);

    header
      .enter()
      .append("div")
      .attr("class", function(d, i) {
        return "column is-size-7-desktop col-" + i;
      });
    // .classed("cell", true);

    selection.selectAll(".header .column").text(function(d) {
      if (d == "model_name") {
        return "name";
      }
      return d;
    });

    header.exit().remove();

    // rows
    var rows = selection.selectAll(".row").data(function(d) {
      return d;
    });

    rows
      .enter()
      .append("div")
      .attr("class", function(d) {
        return "columns row " + d["model_name"];
      })
      .on("click", rowClicked);
    // .attr("class", "row");

    rows.exit().remove();

    var cells = selection
      .selectAll(".row")
      .selectAll(".cell")
      .data(function(d) {
        return columns.map(function(col) {
          return d[col];
        });
      });

    // cells
    cells
      .enter()
      .append("div")
      .attr("class", function(d, i) {
        return "column is-size-7-desktop col-" + i;
      })
      .classed("cell", true);

    cells.exit().remove();

    selection.selectAll(".cell").text(function(d) {
      return d;
    });

    return dg;
  };

  dg.columns = function(_) {
    if (!arguments.length) return columns;
    columns = _;
    return this;
  };

  return dg;
};

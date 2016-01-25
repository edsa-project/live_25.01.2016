
var margin = {top: 180, right: 20, bottom: 20, left: 80},
    width = 1450 - margin.left - margin.right,  //1800
    height = 900 - margin.top - margin.bottom;
var minWidth = 1000; // beyond this force scrolling

var windowWidth = window.innerWidth,
    windowHeight = window.innerHeight;
//console.log("window: " + window.innerWidth + ", " + window.innerHeight);
//console.log("frameWidth: " + frameWidth + ", " + frameHeight);
//console.log("width: " + width + ", " + height);

if (frameWidth < 0)
  frameWidth = 0.95 * windowWidth;  // set at 100% - need margin
if (width > (frameWidth - filterPanelWidth)) // ignore height - will scroll vertically
  width = 0.98 * (frameWidth - filterPanelWidth);
else if (width < ((frameWidth - filterPanelWidth - 100)))
  width = 0.95 * (frameWidth - filterPanelWidth);
//console.log("frameWidth: " + frameWidth + ", " + frameHeight);
//console.log("width: " + width + ", " + height);
if (width < minWidth)
  width = minWidth;
//console.log("width: " + width + ", " + height);

var line = d3.svg.line(),
    axis = d3.svg.axis()
                  .orient("left"),
//                  .ticks(5),  // calculated based on maxFrequency
    defaultTickCount = 10,  //5,
    background,
    foreground;

var x = d3.scale.ordinal().rangePoints([0, width], 1),
    y = {},
    dragging = {};

var renderRate = 200; // default


var strokeWidth = 1.0
    defaultStrokeDasharray = 3;
var lastPathSelected;
var defaultPathColour = "steelblue",
    currentSelectionColour = "red",
    lastSelectionColour = null;
var defaultOpacity = 90;
var colourCodesLib;


var svg = d3.select("#plot")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var color = d3.scale.linear()
              .domain([0, 0.5, 1])
              .range(["#ef2212", "#e7c767", "#2799df"])
              .interpolate(d3.interpolateHcl);

// data vars...
var removingAxis,
    fadeOnFilter = false; // default is not to draw at all...
var dimensions, dataHeaders,
    parsedData, currentFilter;
var //numericHeaders = [],
    suppressedHeaders = [],
    hiddenAxesLocations = [],
    skillNotDefined = [];

var summaries = [], trendLines = [],
    termFrequencyMax, termFrequencyMedian;
var medianFrequencyLabel = "Median frequency",
    maxFrequencyLabel = "Max frequency";

var minFrequency = maxFrequency = 0;



function drawParallelCoordinates(dataFile, fileDelimiter, skillSets, ignoredHeaders) {

  Object.keys(skillSets).forEach(function (skillSet) {
    skillSets[skillSet].forEach(function (skill) {
      numericHeaders.push(skill);
    });
  });

  suppressedHeaders = ignoredHeaders;

  var dsv = d3.dsv(fileDelimiter, "text/utf-8");  // plain
  dsv(dataFile, function(error, highDData) {
//	dsv(dataFile, typeData, function(error, highDData) {
    if (error)  // really ] should write to screen...
      return console.error(error);

    dataHeaders = d3.keys(highDData[0]);


    // data parsing
    var colourCodesDomain = [];

    highDData.forEach(function (d, i) {

      colourCodesDomain.push(d.identifier);

      // dates... - done in typedata - del on complete
      //2015-05-13T01:21:07
      if (d.datePosted.trim() != "") {
        d.datePosted = isoDateFormat.parse(d.datePosted);

        if (d.datePosted != null) {
          if (d.datePosted < minValidDate)
            minValidDate = d.datePosted;
          else if (d.datePosted > maxValidDate)
            maxValidDate = d.datePosted;
        }

        if (datePostedEmpty) // need to set only once
          datePostedEmpty = false;
      }

      if (d.firstSeen.trim() != "") {
        d.firstSeen = isoDateFormat.parse(d.firstSeen);

        if (d.firstSeen != null) {
          if (d.firstSeen < minValidDate)
            minValidDate = d.firstSeen;
          else if (d.firstSeen > maxValidDate)
            maxValidDate = d.firstSeen;
        }

        if (firstSeenEmpty)
          firstSeenEmpty = false;
      }

      if (d.lastSeen.trim() != "") {
        d.lastSeen = isoDateFormat.parse(d.lastSeen);

        if (d.lastSeen != null) {
          if (d.lastSeen < minValidDate)
            minValidDate = d.lastSeen;
          else if (d.lastSeen > maxValidDate)
            maxValidDate = d.lastSeen;
        }

        if (lastSeenEmpty)
          lastSeenEmpty = false;
      }
/**/
      try {
        formatDateDby(d.datePosted)
       } catch (error) {
//         console.log("ALERT - error in datePosted: " + d.identifier + ": " + d.title); // whichever date broke will be empty or null...
         d.datePosted = new Date(-1); //- new Date() === Date.now()
       }

      try {
        formatDateDby(d.firstSeen)
       } catch (error) {
//         console.log("ALERT - error in firstSeen: " + d.identifier + ": " + d.lastSeen + " - " + d.title); // whichever date broke will be null...
         d.firstSeen = new Date(-1);
       }
      try {
          formatDateDby(d.lastSeen)
      } catch (error) {
//            console.log("ALERT - error in lastSeen: " + d.identifier + ": " + d.firstSeen + " - " + d.title); // whichever date broke will be null...
        d.lastSeen = new Date(-1);
      }
      // end dates...*/

      // stats ...
      minFrequency = Math.min(minFrequency, d.minValue);
      maxFrequency = Math.max(maxFrequency, d.maxValue);

      Object.keys(d).forEach(function(g) {

        if (!summaries[g]) {
          summaries[g] = [];
          summaries.push(summaries[g]);
        }
        if (contains(numericHeaders, g, true))
          summaries[g].push(d[g] = +d[g]); // @todo- need to eliminate text bleeding into first... // will cause problems - need to strip out all such entries...
        else
          summaries[g].push("");  // or breaks axis labels...
      });

    }); // end iteration through dataset


    if (highDData.length > 10000)
      ; // do nothing - use default - 200
    else if (highDData.length > 1000)
      renderRate = 50;
    else if (highDData.length > 500)
      renderRate = 20;
    else if (highDData.length > 200)
      renderRate = 10;
    else
      renderRate = 5;


    // really don't understand this - reading the same object into another function changes the structure ???????
    buildSkillsetPanel("selectorPanel", skillSets, true, summaries);


    //* finalise other stats ... */
    termFrequencyMedian = [], termFrequencyMax = [];
    Object.keys(summaries).forEach(function(g) {
      termFrequencyMedian[g] = d3.median(summaries[g]);
      termFrequencyMax[g] = d3.max(summaries[g]);

      if ((termFrequencyMax[g] === 0) && contains(numericHeaders, g, true))
        skillNotDefined.push(g);
    });

    termFrequencyMedian.identifier = medianFrequencyLabel;
    termFrequencyMax.identifier = maxFrequencyLabel;
    termFrequencyMedian.dataSourceId  = termFrequencyMedian.industry  = termFrequencyMedian.requiredLanguage  = "N/A";
    termFrequencyMax.dataSourceId     = termFrequencyMax.industry     = termFrequencyMax.requiredLanguage     = "N/A";

    trendLines.push(termFrequencyMedian);
    trendLines.push(termFrequencyMax);

    // to make sure all trends are included
    Array.prototype.push.apply(highDData, trendLines);


    //* complete colour-coding - polylines */
    colourCodesDomain = d3.set(colourCodesDomain).values();

    var cDomain = [], cRange = [],
        colourSelector = d3.merge([ // set full first as may need to extend range...
                                    colorbrewer.Spectral[11],
                                    colorbrewer.Accent[8],
                                    colorbrewer.GnBu[9],  //YlOrBr[9],
                                    colorbrewer.PuBuGn[9],
                                    colorbrewer.PuOr[9],
                                    colorbrewer.Set3[12],
                                  ]);
    cRange = colourSelector;
    cDomain = colourCodesDomain;

    colourCodesLib = d3.scale.ordinal()
                       .range(cRange)
                       .domain(cDomain);
    //* end - colour-coding - polylines */


    //* ... and draw plot... */
    var tickCount = maxFrequency;
    if /*(maxFrequency >= 100) // @todo - needs to be progressive...- check later for useful values
      tickCount = maxFrequency / 10;
    else if */(maxFrequency >= 50)
      tickCount = maxFrequency / 10;
    else if (maxFrequency >= 20)
      tickCount = maxFrequency / 4;
    axis.ticks(Math.ceil(Math.min(defaultTickCount, tickCount)));

    setAxesDomains(highDData);


    //* ... and drawPlot... */
    background = svg.append("g")
                    //.attr("fill", "none") // or background (NOT picking up from CSS) renders black == none/transparent
                    .attr("class", "background");
    foreground = svg.append("g")
                    //  .attr("fill", "none") // set in css - will be overridden
                    .attr("class", "foreground");

    paths(highDData);
    //* ... and drawPlot... */


    // need to draw after plot - even with fill set to none or transparent hides axes' lines
    drawAxes(dimensions);//, (parsedData = highDData));
    parsedData = highDData;
    //...
  });
}

/*
 * based on: https://www.safaribooksonline.com/blog/2014/02/17/building-responsible-visualizations-d3-js/
 */
//function calcOptimalPlotSize() {
//
//console.log(window.innerWidth + ", " + window.innerHeight);
//
//  var windowWidth = parseInt(d3.select("#graph").style("width")) - margin*2,
//      windowHeight = parseInt(d3.select("#graph").style("height")) - margin*2;
//
//  /* Update the range of the scale with new width/height */
//  xScale.range([0, width]).nice(d3.time.year);
//  yScale.range([height, 0]).nice();
//
//  /* Update the axis with the new scale */
//  graph.select('.x.axis')
//    .attr("transform", "translate(0," + height + ")")
//    .call(xAxis);
//
//  graph.select('.y.axis')
//    .call(yAxis);
//
//  /* Force D3 to recalculate and update the line */
//  graph.selectAll('.line')
//    .attr("d", line);
//
////d3.select(window).on('resize', resize);
////
//}


function clearPlot() {
//  d3.select("#plot")
//    svg.selectAll("*")
//    .remove();
//  d3.selectAll("p").remove();
  d3.selectAll("path")
      .data("")
      .exit()
      .remove();
//  svg.selectAll("#dimension")//.dimension
//      .data("")
//      .exit()
//      .remove();
//  svg.selectAll("#axis")
//      .data("")
//      .exit()
//      .remove();
//  svg.selectAll("#brush")
//      .data("")
//      .exit()
//      .remove();
//
//      console.log("?clear?");
}

function filterView(data, filteredData) {

  if (!filteredData || (filteredData.length == 0)) { // reset

    d3.selectAll("path")
      .style("stroke-opacity", defaultOpacity/100);

    foreground.style("visibility", "visible");
    foreground.style("visibility", "visible");

  } else {
  //console.log(filteredData)

//    d3.selectAll("path")
//      .style("stroke-opacity", 0.35);
//
//    background.selectAll("path")
//              .filter(function(d, i) {
//                console.log(d + "; " + i)
//                return ((i % 3) === 0);
//              })
//              .style("stroke", "green")
//              .style("stroke-dasharray", 4)
//              .style("stroke-width", 5);
//    foreground.selectAll("path")
              //.style("visibility", "hidden")
//              .style("stroke", "green")

    foreground.selectAll("path")
              .data(filteredData, function(d) { console.log("?:" + d); return d; })
              //.enter()//.append("foreground")
//              .filter(
//              filteredData.map(function(g) {
//                 console.log(g)
//                 return g;
//              }))
              .style("stroke", "black")

        console.log("exit")
  }
}

function polyline(data) {
  background.append("path")
            .attr("d", path(data))
            .style("stroke", function() {
//              if (data.identifier === maxFrequencyLabel) // hiding all others...
                return "#ddd";
            })
            .style("stroke-dasharray", function() {
              if (data.identifier.endsWith(" frequency"))
               return defaultStrokeDasharray;
            })
            .style("stroke-linejoin", function() {//linecap
               if (data.identifier.endsWith(" frequency"))
                return "butt";  // round
             })
           .style("stroke-width", function() {
              if (data.identifier.endsWith(" frequency"))
                return strokeWidth * 3;
            })
            .style("stroke-opacity", ((data.identifier.endsWith(" frequency")) ? 0.75 : 0.1));

  foreground.append("path")
            .attr("d", path(data))
            .style("stroke", function() {
              if (data.identifier === maxFrequencyLabel)
                return colourCodes.trendColourA;
              else if (data.identifier === medianFrequencyLabel)
                return colourCodes.trendColourC;
              return colourCodesLib(data.identifier);
            })

    // additional interaction elements...
            .style("stroke-dasharray", function() {
              if (data.identifier.endsWith(" frequency"))
               return defaultStrokeDasharray;
            })
            .style("stroke-linejoin", function() {//linecap
               if (data.identifier.endsWith(" frequency"))
                return "butt";  // round
             })
            .style("stroke-width", ((data.identifier.endsWith(" frequency")) ? (strokeWidth * 3) : strokeWidth))

//            .append("title")  // blocks visual filter if placed separately but works in mouseOver...
//            .text(extractDetail(data))
            .on("mouseout", function() {
              d3.select(this)
                .style("stroke-width", function() {
                  if (data.identifier.endsWith(" frequency"))
                    return strokeWidth * 3;
                  return strokeWidth;
                })
                .style("stroke-opacity", defaultOpacity/100)
                .style("stroke", function() {
                  if (data.identifier === maxFrequencyLabel)
                    return colourCodes.trendColourA;
                  else if (data.identifier === medianFrequencyLabel)
                    return colourCodes.trendColourC;
                  return colourCodesLib(data.identifier);
                });

              if (lastPathSelected != null)
                lastPathSelected.style("stroke-width", strokeWidth * 3)
                                 .style("stroke-opacity", 1.0)
                                 .style("stroke-dasharray", 2)
                                 .style("stroke", currentSelectionColour);
            })
            .on("mouseover", function(d, i) {
              d3.select(this)
                .style("stroke-width", strokeWidth * 3)// + (strokeWidth/3))  // otherwise hidden if lying under another
                .style("stroke-opacity", 1.0)
                .style("stroke-dasharray", function() {
                  if (data.identifier.endsWith(" frequency"))
                    return defaultStrokeDasharray;
                })
                .style("stroke", currentSelectionColour)

                // blocks visual filter if placed separately but works here...
                .append("title")  // blocks visual filter if placed separately but works in mouseOver...
                .text(extractDetail(data))
            })
            .on("dblclick", function(d, i){
              if (data.identifier.endsWith(" frequency"))
                return;

              if (lastPathSelected != null)
                lastPathSelected.style("stroke-width", strokeWidth)
                                 .style("stroke-opacity", defaultOpacity/100)
                                 .style("stroke-dasharray", null)
                                 .style("stroke", function() {
                                   if (data.identifier === maxFrequencyLabel)
                                     return colourCodes.trendColourA;
                                   else if (data.identifier === medianFrequencyLabel)
                                     return colourCodes.trendColourC;
                                   return colourCodesLib(data.identifier);
                                 });

              lastPathSelected = d3.select(this);  // reset
              lastSelectionColour = colourCodesLib(data.identifier);

              printOutLastSelection(extractFormattedDetail(data), "selectionDetail");
            });
    ///////////end interaction
} // end function - draw individual polylines


function setAxesDomains(highDData) {
  x.domain(dimensions = dataHeaders.filter(function(d) {
    if (contains(suppressedHeaders, d, true) ||
        ( (datePostedEmpty && (d === "datePosted")) ||
          (!datePostedEmpty && firstSeenEmpty && (d === "firstSeen")) ||
          (/*lastSeenEmpty &&*/ (d === "lastSeen"))) )
      return false;

    if (!contains(numericHeaders, d, true)) {
      if ((!datePostedEmpty && (d === "datePosted")) ||
          (!firstSeenEmpty && (d === "firstSeen")) ||
          (!lastSeenEmpty && (d === "lastSeen")))
        return y[d] = d3.time.scale()
                              .domain([+minValidDate, +maxValidDate])
                              .range([height, 0]);
      else {
        return y[d] = d3.scale.ordinal()
                              .domain(highDData.map(function(p) { return p[d]; }))
                              .rangePoints([height, 0]);}
    } else {
      return (y[d] = d3.scale.linear()
                              .domain([minFrequency, maxFrequency])
                              .range([height, 0])
              );
    }
  }));  // end setting x-domain
}

function drawAxes(dimensions) {

  var groupElement = svg.selectAll(".dimension")
                        .data(dimensions)
                        .enter().append("g")
                        .attr("class", "dimension")
                        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
                        .call(d3.behavior.drag()
                                .origin(function(d) { return {x: x(d)}; })
                                .on("dragstart", function(d) {
																	if (!d3.event.sourceEvent.shiftKey)  // at least prevent redraw (due to drag) when (double-)clicking
																		return;

                                  dragging[d] = x(d);
                                  d3.selectAll("path")
                                    .style("stroke-opacity", 0.35);
                                  background.attr("visibility", "hidden");
                                })
                                .on("drag", function(d) {
																	if (!d3.event.sourceEvent.shiftKey)  // at least prevent redraw (due to drag) when (double-)clicking
																		return;

                                  dragging[d] = Math.min(width, Math.max(0, d3.event.x));
                                  foreground.attr("d", path(currentFilter ? currentFilter : parsedData));
                                  dimensions.sort(function(a, b) { return position(a) - position(b); });
                                  x.domain(dimensions);
                                  groupElement.attr("transform", function(d) {
                                    return "translate(" + position(d) + ")"; })
                                  })
                                .on("dragend", function(d) {
// @todo - problem with redraw - if dragged after any hide doesn't redraw paths properly - still linked to previous, not new axes...
// and doesn't sort out again till next hide...

																	if (!d3.event.sourceEvent.shiftKey)  // at least prevent redraw (due to drag) when (double-)clicking
																		return;

                                  delete dragging[d];
                                  transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
//                                  transition(foreground).attr("d", path(currentFilter ? currentFilter : parsedData));
                                  background.attr("d", path(currentFilter ? currentFilter : parsedData))
                                           .transition()
                                           .delay(500)
                                           .duration(0)
                                           .attr("visibility", (removingAxis ? "none" : null)); //@todo - sort out visibility - in polylines
                                  //dimensions.sort(function(a, b) { return position(a) - position(b); });
                                  //x.domain(dimensions);
                                  paths(currentFilter ? currentFilter : parsedData);
                                  transition(d3.selectAll("path"))  // not really sure how much effect this is having...
                                    .style("stroke-opacity", defaultOpacity/100);
                                  brush();
                                  updateAxes(); //drawAxes(dimensions); // not redrawing - something in paths blocking this...

// doesn't work from here...
//hiddenAxesLocations[d.toLowerCase()] = dimensions.indexOf(d);
//                                  hideShowAxis(d, groupElement);

//@todo -  del next on last check - doesn't seem needed - explicit call to brush() further down working as needed
// reset properties as necessary...
//var extent = y[d].brush.extent(); //
//console.log("e: " + extent)

                                  removingAxis = false;
                                }))
                        .on("mouseover", function(d) {
                          d3.select(this)
                          .style("cursor", "grab")
                        })
                        .on("dblclick", function(d) { // @todo - where is the delay??? - click triggers drag- and therefore redraw...before action here!!! :S
                          hiddenAxesLocations[d.toLowerCase()] = dimensions.indexOf(d);
                          removingAxis = hideAxes([d], groupElement);
                          if (removingAxis)
                            updateSelectorPanelItem(d, false);
                        });

  groupElement.append("g")
              .attr("class", "axis")
              .each(function(d) {
                if ((d === "date") || (d === "datePosted") || (d === "firstSeen") || (d === "lastSeen"))
                  d3.select(this).call(axis.scale(y[d])
                                            //.ticks(5)
                                            .tickFormat(formatDateDbyS)
                  );
                else if (contains(numericHeaders, d, true))
                  d3.select(this).call(axis.scale(y[d])
                                            .tickFormat(formatInteger));
                else
                  d3.select(this).call(axis.scale(y[d]));
              })
              .append("text")
              .style("font-size", "12px")
              .style("fill", function(d) {
                if (contains(skillNotDefined, d, true))
                  return colourCodes.colourMeInactive;
                else if (contains(numericHeaders, d, true))
                  return skillSetsColourCodesLib(getSkillSetLabel(d, skillSets));
              })
              .style("text-anchor", "start")
              .attr("y", -9)
              .attr("transform", function(d) { return "translate(10, -5) rotate(-65)"; })
              .text(function(d) {
                if (d === "dataSourceId")
                  return "data source";
                else if (d === "datePosted")
                  return "date posted";
                return d.toLowerCase().replace(/_/g, " ");
              })
              .append("title")
              .text(function(d) {
                return "Shift-drag on label to relocate axis, drag along axis to filter or double-click to hide skill '" + d +"'";
              });

  groupElement.append("g")
              .attr("class", "brush")
              .each(function(d) {
                d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d])
                                                        .on("brushstart", brushstart)
                                                        .on("brush", brush));
               })
              .selectAll("rect")  // @todo - don't get what is going on - right, bottom edges hidden - sorted out... not sure how...
              .attr("x", -6)
              .attr("width", 12)
              .append("title")
              .text("drag along axis to filter");

} // end function - drawAxes

function updateAxes(redrawAxisLabels, dimension, extent) {
//  // update brushes //@todo - sort out...may not need this - calling in dragEnd seems to be working without any help
//  if (dimension) {
//    var brush_el = d3.selectAll(".brush")
//        .filter(function(key) { return key == dimension; });
//    // single tick
//    if (extent) {
//      // restore previous extent
//      brush_el.call(y[dimension].brush = d3.svg.brush().y(y[dimension]).extent(extent).on("brush", brush));
//    } else {
//      brush_el.call(y[dimension].brush = d3.svg.brush().y(y[dimension]).on("brush", brush));
//    }
//  } else {
//    // all ticks
//    d3.selectAll(".brush")
//      .each(function(dimension) { d3.select(this).call(y[axis].brush = d3.svg.brush().y(y[d]).on("brush", brush)); })
//  }

//  brush_count++;
//
//  show_ticks();

  // update axes

//      // hide lines for better performance
//      d3.select(this).selectAll('line').style("display", "none"); // messes up redrawing of axes... - both hide and reduce opacity
//  d3.selectAll("path")
//    .style("stroke-opacity", 0.35);

  if (!redrawAxisLabels) {

    d3.selectAll(".axis")
      .each(function(d) {

        if ((d === "date") || (d === "datePosted") || (d === "firstSeen") || (d === "lastSeen"))
          d3.select(this)
            .transition()
            .duration(720)
            .call(axis.scale(y[d])
            .tickFormat(formatDateDbyS)
          );
        else if (contains(numericHeaders, d, true))
          d3.select(this)
            .transition()
            .duration(720)
            .call(axis.scale(y[d])
            .tickFormat(formatInteger));
        else
          d3.select(this)
            .transition()
            .duration(720)
            .call(axis.scale(y[d]));
      });
  } else {
      var g_axes = d3.selectAll(".dimension")
                     .data("");
      g_axes.exit().remove();
      drawAxes(dimensions);
    }

//      // bring lines back
//      d3.select(this).selectAll('line').transition().delay(800).style("display", null);
//  transition(d3.selectAll("path"))  // not really sure how much effect this is having...
//    .style("stroke-opacity", defaultOpacity/100);

// del - can't find what this is supposed to do?
//      d3.select(this)
//        .selectAll('text')
//        .style('font-weight', null)
//        .style('font-size', null)
//        .style('display', null);
//    });
}

//function hideShowAxis(d, groupElement) {
//console.log("?: " + dimensions.length)
//  dimensions = _.difference(dimensions, [d]);
//  //dimensions.sort(function(a, b) { return position(a) - position(b); }); - doesn't sort out the issue with paths on reorder after hide...
//  x.domain(dimensions);
//
//  groupElement.attr("transform", function(p) {  //@todo - check iteration...
////    if (position(p))  // @todo - till get this to filter out removed...
//      return "translate(" + position(p) + ")";
//  });
//  groupElement.filter(function(p) { // @todo - not filtering out...
//    return contains([d], p, true)//p == d;// valid only when reading in a single - this now reads in an array
//  }).remove();
//
//console.log("?: " + dimensions.length)
//  if (hiddenAxesLocations[d.toLowerCase()] != -1)
//    dimensions.splice(hiddenAxesLocations[d.toLowerCase()], 0, d);
//  else
//    dimensions.push(d);
//  x.domain(dimensions);
//console.log("?: " + dimensions.length)
//
//  groupElement.attr("transform", function(p) { return "translate(" + position(p) + ")"; });
//  updateAxes();
//}
/*
 * function borrowed from: http://bl.ocks.org/syntagmatic/3150059
 * next created, the following adapted from the same
 */
function hideAxes(d, groupElement) {
  if (containsAnyOf(suppressedHeaders, d, true) ||
      (containsAnyOf([ "dataSourceId", /*"industry", "requiredLanguage",*/ "datePosted", "firstSeen", "lastSeen" ], d, true)) ) {
    alert("You may only hide axes showing skill counts!");// and other job posting attributes!")
    return false;
  }

  dimensions = _.difference(dimensions, d);
  //dimensions.sort(function(a, b) { return position(a) - position(b); }); - doesn't sort out the issue with paths on reorder after hide...
  x.domain(dimensions);

  groupElement.attr("transform", function(p) {  //@todo - check iteration...
//    if (position(p))  // @todo - till get this to filter out removed...
      return "translate(" + position(p) + ")";
  });
  groupElement.filter(function(p) { // @todo - not filtering out...
    return contains(d, p, true)//p == d;// valid only when reading in a single - this now reads in an array
  }).remove();

  //updatePlot(null, groupElement);
  paths(currentFilter ? currentFilter : parsedData);
  updateAxes(); //drawAxes(dimensions); // not redrawing - something in paths blocking this...

  return true;
}

function showAxis(d, groupElement) {
  if (hiddenAxesLocations[d.toLowerCase()] != -1)
    dimensions.splice(hiddenAxesLocations[d.toLowerCase()], 0, d);
  else
    dimensions.push(d);
  x.domain(dimensions);

  groupElement.attr("transform", function(p) {
    return "translate(" + position(p) + ")";
  });

  //updatePlot(d, groupElement, true);
  paths(currentFilter ? currentFilter : parsedData);
  updateAxes(true); //drawAxes(dimensions); // not redrawing - something in paths blocking this...
}

//@todo - double-check this with updateAxes
//function updatePlot(update, groupElement, updateAxes) {
//
//  // update polylines and transition back in ...
//  // ignore axes, no need to rescale
//  d3.selectAll(".foreground")
//    .each(function (d) {
//      d3.select(this).selectAll('path')
//                      .style("display", "none");
//
//      d3.select(this).selectAll('path')
//                      .transition()
////                      .delay(1)//800)
//                      .attr("d", path)
//                      .style("display", null);
//
//    }); // end update - polyline
//
//    if (updateAxes) {
//      var g_axes = d3.selectAll(".dimension")
//                     .data("");
//      g_axes.exit().remove();
//      drawAxes(dimensions);
//    }
//
//  // and any "brushes set" - reset when paths redrawn. even when commented out doesn't redraw brush area - there's an error here somewhere
////  updateBrushes(d);
//  if (update) {
//    var coordinateBrush = d3.selectAll(".brush")
//                            .filter(function(key) { return key == update; });
//    // single tick
//    coordinateBrush.call(y[update].brush = d3.svg.brush()
//                                              .y(y[update])
//                                              .on("brush", brush));
//  } else {  // all ticks
//    d3.selectAll(".brush")
//      .each(function (update) {
//        d3.select(this)
//          .call(y[update].brush = d3.svg.brush()
//                                    .y(y[update])
//                                    .on("brush", brush));
//      })
//  } // end if-else update brushes
//}
// end show-hide axes functions

function position(data) {
  var v = dragging[data];
  return v == null ? x(data) : v;
}

function transition(g) {
  return g.transition().duration(500);//200);//
}

function path(data) {

  return line(dimensions.map(function(p) {
//console.log("p: " + p + " : " + data[p])
    return [position(p), y[p](data[p])];
  }));
}

function paths(data) {
  // ... render queue
  var render = renderQueue(polyline)
                  .clear(clearPlot);
  render.rate(renderRate);

  // ... and queue data
  render(data);
}

function brushstart() {
  d3.event.sourceEvent.stopPropagation();
}

function brush() {
  var actives = dimensions.filter(function(d) { return !y[d].brush.empty(); }),
      extents = actives.map(function(d) { return y[d].brush.extent(); });
console.log(extents + "\n" + actives)
//  foreground.style("display", function(g) {
//    return actives.every(function(d, i) { //@todo - with g - find how to ignore and return regardless - for trend line
//console.log("in brush: " + d + " - " + g)
//      if (!contains(numericHeaders, d, true)) // categorical/ordinal
//        return extents[i][0] <= y[d](g[d]) && y[d](g[d]) <= extents[i][1];
//      else // linear
//        return extents[i][0] <= g[d] && g[d] <= extents[i][1];
//    }) ? null : "none";
//  });
//

//  parsedData.map(function(g) {
//    foreground.selectAll("path")
//              //.style("stroke",// @todo -doesn't work... nor with path either...
//              .style("display",
//    function() { ) ? null : "none" })
//  });


  var filteredData = [];  // @todo - finish switch between fading and not drawing background
////  foreground.style("display",// @todo -doesn't work... nor with path either...
//  parsedData.map(function(g) {
//    return actives.every(function(d, i) {
//
//      if (((d === "date") || (d === "datePosted") || (d === "firstSeen") || (d === "lastSeen")) ||  // dates
//          (!contains(numericHeaders, d, true))) // linear
//        return extents[i][0] <= g[d] && g[d] <= extents[i][1];
//      else  // categorical/ordinal
//        return extents[i][0] <= y[d](g[d]) && y[d](g[d]) <= extents[i][1];
//    }) ? filteredData.push(g) : null;
//  });
//
//    //foreground.selectAll("path")
//              //.filter(
              parsedData.map(function(g) {
                return actives.every(function(d, i) {
//                console.log(d + ", " + i +  " - " + (g[d] && g[d]))
                      if (((d === "date") || (d === "datePosted") || (d === "firstSeen") || (d === "lastSeen")) ||  // dates
                          (contains(numericHeaders, d, true))) // linear
                        return extents[i][0] <= g[d] && g[d] <= extents[i][1];
                      else  // categorical/ordinal
                        return extents[i][0] <= y[d](g[d]) && y[d](g[d]) <= extents[i][1];
                //    }) ? "#ddd"  : "red" })//filteredData.push(g) : null;
                })  // end return actives
                ? filteredData.push(g) : console.log("");//fail" + g);
              })//) // end filter
//              //.style("visibility", "hidden");
//
//              //console.log("x: " + filteredData)
//
console.log(parsedData.length + " - " + filteredData.length)
  paths(currentFilter = _.union(filteredData, trendLines));
//filterView(parsedData, currentFilter = _.union(filteredData, trendLines))
//  drawAxes(dimensions); // not redrawing - something in paths blocking this...
  updateAxes();
}


// helper functions

/*
 * input of type: key = skillset; key = languageCode; value: skills (translated)
 */
function filterSkills(parsedInput, selectedSkillSet, languageOfInterest) {
  var skills = [];

  Object.keys(parsedInput).forEach(function(d) {  // skillSets
    if (d === selectedSkillSet) {

      Object.keys(parsedInput[d]).forEach(function(language) {
        if (language === languageOfInterest)
          skills = parsedInput[d][language]; // annoyingly cannot break out...
      });
    }
  });

  return skills;
}

function applyFilter(itemSelected, skillSet) {  // note: skillSet is label list, not HTMLInputElements
  var groupElement = d3.selectAll(".dimension");  //foreground");
  var skillLabel;

  if (skillSet) {
    skillSet.forEach(function (d) {
      if ((skillLabel = getContainedElement(dimensions, d, true)) != null)  // get last position... will restore to this point... ignoring any other relocations...
        hiddenAxesLocations[d.toLowerCase()] = dimensions.indexOf(skillLabel);
    }); // need to get all locations before start removing...

    skillSet.forEach(function (d) {
      if ((skillLabel = getContainedElement(dimensions, d, true)) != null) {
        if (!itemSelected.checked)  // cascaded to "children"
          hideAxes([skillLabel], groupElement);

      } else if (itemSelected.checked)
        showAxis(getContainedElement(dataHeaders, d, true), groupElement);
    });
  } else {  // just the one skill
    var skill = itemSelected.id;
    skill = skill.substring(skill.lastIndexOf(defaultDelimiter) + 1);

    if ((skillLabel = getContainedElement(dimensions, skill, true)) != null)
      hiddenAxesLocations[skill.toLowerCase()] = dimensions.indexOf(skillLabel);

    if (itemSelected.checked) {
      if (skillLabel == null) // not currently displayed... should normally not happen, but greyed out may be unticked but included
        showAxis(getContainedElement(dataHeaders, skill, true), groupElement);
    } else
      hideAxes([getContainedElement(dataHeaders, skill, true)], groupElement);
  }
}

function extractFormattedDetail(dataPoint) {
  var info = "<h3>Posting Detail & Term Frequency</h3>" +
                "(up to <a href=\"#plot\">plot</a>)<br />&nbsp;<br />" +
                "<div class='selectorPanel' style='width:1800px; height:350px;'>" +
                "<table border=1 style='cellpadding:5px; color:#a6c1cb;'>";

  for (var key in dataPoint) {
    if ((key === "dataSourceId") || (key === "industry") || (key === "requiredLanguage") || (key === "geoLocation"))
      ; // do nothing
    else if ((key === "datePosted") || (key === "firstSeen") || (key === "lastSeen")) {
//      if ((dataPoint[key] != "") && (+(dataPoint[key]) != -1))
//      info += "<tr><td width=10%><b><i>" + key.replace(/_/g, " ") + "</i></b> </td><td width=65%>" + formatDateDbY(dataPoint[key]) + "</td></tr>";
    } else if ((key === "description") && (dataPoint[key].trim().length > 0))
      info += "<tr><td width=10%><b><i>" + key.replace(/_/g, " ") + "</i></b> </td><td width=65%>" + truncate(dataPoint[key], 500, "... (more at...)") + "</td></tr>";
    else if ((key === "requiredLanguage") && ((dataPoint[key].trim() === "") || (dataPoint[key] === "ns")))
      info += "<tr><td width=10%><b><i>" + key.replace(/_/g, " ") + "</i></b> </td><td width=65%>Not Specified</td></tr>"
    else if ((key != "identifier") && (key != "minValue") && (key != "maxValue") &&
              (dataPoint[key] != "") && (dataPoint[key] != "0"))
    info += "<tr><td width=10%><b><i>" + key.replace(/_/g, " ") + "</i></b> </td><td width=65%>" + dataPoint[key] + "</td></tr>"
  }
  return info + "</table></div>" +
                 "<br />&nbsp;<br />(back up to <a href=\"#plot\">plot</a>)<br />";
}

function extractDetail(dataPoint) {
  if (dataPoint.identifier === maxFrequencyLabel)
    return "Maximum term frequency trend line";

  var info = "";
  for (var key in dataPoint) {
    if ((key === "dataSourceId") || (key === "industry") || (key === "requiredLanguage"))
      ; // do nothing
    else if ((key === "datePosted") || (key === "firstSeen") || (key === "lastSeen")) {
//      if ((dataPoint[key] != "") && (+(dataPoint[key]) != -1))
//        info += "* " + key.replace(/_/g, " ") + ":\t" + formatDateDbY(dataPoint[key]) + "\n";
    }
//                        else if (key === "description")
//                          ; // do nothing -  info += "* " + key.replace(/_/g, " ") + ":\t" + truncate(dataPoint[key], 1500, "... (more at...)") + "\n";
    else if ((key === "requiredLanguage") && ((dataPoint[key].trim() === "") || (dataPoint[key] === "ns")))
      info += "* " + key.replace(/_/g, " ") + ":\tNot Specified\n";
    else if ((key != "identifier") && (key != "description") && (key != "minValue") && (key != "maxValue") &&
              (dataPoint[key] != "") && (dataPoint[key] != "0"))
      info += "* " + key.replace(/_/g, " ") + ":\t" + dataPoint[key] + "\n";
  }
  return info + "\n *** Double-click on entry to reveal more detail... ***";
}


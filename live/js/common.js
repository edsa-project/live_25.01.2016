
var colourCodes = { jobs : "red",
                    Country_Percentage: "black",
                    Skills_Percentage: "olive",
//                    regionCount: "steelblue",
                    trendColourA : "#d93d66", //Rose pink //#21637d", //730100"; // magenta
                    trendColourB : "#ff815e",  //Orange
                    trendColourC : "#458c7f",  //Green

                    lato_dark_blue1 : "#21637d",
                    lato_dark_blue2 : "#4d8297",
                    lato_dark_blue5 : "#a6c1cb",
                    lato_dark_blue6 : "#d3e0e5",
                    colourMeInactive : "#b5b5b5",//dadada", //dce2e2",// //"lightgrey"

                  };

var parseJobCountOptions = {  linear_complete : 0,
                              linear_by_skill : 1,
                              linear_by_date : 2,
                              log_complete : 3,
                              log_by_skill : 4,
                              log_by_date : 5
                            };

var levelOfDetail = { distant : 10,
                      low : 11,
                      medium : 12,
                      high : 13,
                      full : 14
                    };

var frameWidth = -1,
    frameHeight = 1300,
    filterPanelWidth = 355;


//
//    var colourCodesLib = d3.scale.ordinal()
//                            .range(d3.merge([
////                                    colorbrewer.RdYlBu[7],
////                                    colorbrewer.Pastel1[8],
//                                    colorbrewer.Spectral[11],
//                                    colorbrewer.Accent[8],
////                                    colorbrewer.RdYlGn[11],
//                                  ]))
//                            .domain(colourCodesDomain);



function filterByCountryPercentage(key, threshold, data) {
  var slice = data.filter(function(coordinate) {
                      if (coordinate.Country_Percentage >= threshold)
                        return coordinate;
                    }).sort(function(a, b) {
                      return (b.Country_Percentage > a.Country_Percentage);
                    });

  var returnValue,  // keeps iterating past this...
      count = 0;

  slice.forEach(function (jobSet) {
    if (!returnValue && (key === jobSet.Country_Percentage))
      returnValue = slice.length - count;
    count++;
  });

  return (!returnValue ? "" : returnValue);
}

function filterBySkillsPercentage(key, threshold, data) {
  var slice = data.filter(function(coordinate) {
                      if (coordinate.Skills_Percentage >= threshold)
                        return coordinate;
                    }).sort(function(a, b) {
                      return (b.Skills_Percentage > a.Skills_Percentage);
                    });

  var returnValue,
      count = 0;

  slice.forEach(function (jobSet) {
    if (!returnValue && (key === jobSet.Skills_Percentage))
      returnValue = slice.length - count;
    count++;
  });

  return (!returnValue ? "" : returnValue);
}


function printOutLastSelection(output, divId) {
  output = //"<p>&nbsp;</p><p style='font-size: 1.4em; margin-left: 1em;'>Last Selection</p>" +
    "<span style='font-size: 1.3em; margin-left: 4em;'>" +  output + "</span>";
  document.getElementById("" + divId + "").innerHTML = output;

  location.href = "#" + divId;
}

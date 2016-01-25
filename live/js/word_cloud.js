var width = 900,
    height = width * 3/4;//1100;
var minWidth = 600; // beyond this force scrolling

var windowWidth = window.innerWidth,
    windowHeight = window.innerHeight;

if (frameWidth < 0)
  frameWidth = 0.95 * windowWidth;  // set at 100% - need margin
if (width > (frameWidth - filterPanelWidth)) // ignore height - will scroll vertically
  width = 0.98 * (frameWidth - filterPanelWidth);
else if (width < ((frameWidth - filterPanelWidth - 100)))
  width = 0.95 * (frameWidth - filterPanelWidth);

if (width > windowWidth * 2/3)
  width = (windowWidth * 2/3) -100;

width = Math.max(width, minWidth);
height = Math.min(820, width * 3/4);


var parsedPostings;
var overrideDefaultDataTableHeight;


function drawWordCloud(datafile, fileDelimiter, skillSets, matchDataTableHeight) {

  overrideDefaultDataTableHeight = matchDataTableHeight;

  var dsv = d3.dsv(fileDelimiter, "text/utf-8");  // plain
  dsv(dataFile, function(error, highDData) {
    if (error)
      return console.error(error);


  ///////////////
  colourCodesLib = setupColourCoding(skillSets);


  highDData.sort(function(a, b) {
    // reverse chronological
    if (((a.datePosted != null) && (a.datePosted.trim().length > 0)) &&
        ((b.datePosted != null) && (b.datePosted.trim().length > 0))) {
      if (a.datePosted > b.datePosted)
        return 1;
      else if (a.datePosted < b.datePosted)
        return -1;
    }

    if (a.firstSeen > b.firstSeen)
      return 1;
    else if (a.firstSeen < b.firstSeen)
      return -1;

    // chronological
    else if (a.lastSeen < b.lastSeen)
      return 1;
    else if (a.lastSeen > b.lastSeen)
      return -1;
    return 0;
  });

  parseInput(highDData, skillSets, summaries, minFrequency, maxFrequency);
  parsedPostings = highDData;
//  console.log(JSON.stringify(highDData, null, 3));

  var wordCloud = d3.nest()
                    .key(function (d) {
                      return d;
                    })
                    .rollup(function(d) {
                       return d3.sum(summaries[d]);
                      })
                    .entries(Object.keys(summaries).filter(function(d) {
                      if (contains(numericHeaders, d, true))
                        return d;
                    }));

  wordCloud.forEach(function(d) {
    d.text = d.key;
    d.size = Math.log(d.values);
  });

  ///////////////


  d3.layout.cloud().size([width, height])
      .words(wordCloud)
//      .rotate(function() { return ~~(Math.random() * 2) * 90; })
      .font("Impact")
      .fontSize(function(d) { // @todo - use a function to scale better...
        return (d.size * d.size * 1.2);
      })//   ((d.size > 0 ) ? d.size + 20 : d.size); }) //@todo - need to scale
      .on("end", draw)
      .start();
  });
}

function parseInput(jobPostings, skillSets, summaries, minFrequency, maxFrequency) {

  Object.keys(skills).forEach(function (skillSet) {
    skills[skillSet].forEach(function (skill) {
      numericHeaders.push(skill);
    });
  });


  jobPostings.forEach(function (d, i) {

    //2015-05-13T01:21:07
    //2015-10-06T16:42:35
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

    minFrequency = Math.min(minFrequency, d.minValue);
    maxFrequency = Math.max(maxFrequency, d.maxValue);

    Object.keys(d).forEach(function(g) {

      if (!summaries[g]) {
        summaries[g] = [];
        summaries.push(summaries[g]);
      }
      if (contains(numericHeaders, g, true))
        summaries[g].push(+d[g]); // need to eliminate text bleeding into first... // will cause problems - need to strip out all such entries...
      else
        summaries[g].push("");  // or breaks axis labels...
    });

  }); // end iteration through dataset
}

function draw(terms) {
  d3.select("#plot").append("svg")
    .attr("width", width)
    .attr("height", height)

    .append("g")
    .attr("transform", "translate(" + (width/2) + "," + (height/2.0) + ")")//1.8
    .selectAll("text")
    .data(terms)

    .enter().append("text")
    .style("font-size", function(d) { return d.size + "px"; })
    .style("font-family", "Impact")
    .style("fill", function(d, i) {
      return colourCodesLib(getSkillSetLabel(d.text, skillSets));
     })
    .attr("text-anchor", "middle")
    .attr("transform", function(d) { ////@todo - need to scale
      return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
    })
    .attr("id", function (d) { return (getSkillSetLabel(d.text, skillSets) + defaultDelimiter + d.text); } )
    .text(function(d) { return d.text; })

    // interaction
    .on("mouseover", function(d) {
      //document.getElementById(getSkillSetLabel(d.text, skillSets) + defaultDelimiter + d.text).style.cursor = "pointer";
      d3.select(this)
      .style("cursor", "pointer")
    })
    .on("dblclick", function(d) {
      getMatchingPosts(parsedPostings, d);
    })
    .append("title")
    .text(function(d) {
      return ("total no. of occurrences of '" + d.text + "': " + d.values + "\n\t(double-click to reveal matching posts...)");
    })
    ;
}

function getMatchingPosts(jobPostings, term) {
  var slice = [];

  var matchCount = 0; // number of postings matched
  var found;

  jobPostings.forEach(function (d) {
    found  = false;

    if (!found) { // in place of break...
      Object.keys(d).forEach(function(skill) {

        if (contains(numericHeaders, skill, true) && (term.text.toLowerCase() === skill.toLowerCase())) {
          if (+d[skill] > 0) {

            slice.push(d);
            matchCount++;
            found = true;
          }
        }
      });
    }

  }); // end outer foreach


  var info //= formatResultSet(term, slice);
            = formatResultHeader(term, slice);
  printOutLastSelection(info, "selectionHeader");


  var dataTableHeight;
  if (overrideDefaultDataTableHeight)
    dataTableHeight = ((height > 500) ? (height - 200) : 350) + "px";

  drawDataTableFromJson(slice, [], "#selectionDetail", dataTableHeight);

  return slice;
}

function formatResultHeader(term, slice) {
  var skillSet = getSkillSetLabel(term.text, skillSets);
  skillSet = ((skillSet) ? " (skill set: <i>" + skillSet.replace(/_/g, " ") + "</i>)" : "");
  var info = "<h3>Skill '<i>" + term.text + "</i>'" + skillSet + "\u2004\u2014<br />\u2004\u2004" + slice.length + " postings found! with total frequency: " + (term.values) + "<h3>";

  info += "<h3>Posting Detail:</h3>";
  return info;
}

function formatResultSet(term, slice) {
  var info = "<h3>Skill '<i>" + term.text + "</i>'\u2004\u2014<br />\u2004\u2004" + slice.length + " postings found! with total frequency: " + (term.values) + "<h3>";

  info += "<h3>Posting Detail & Term Frequency (including other terms)</h3>" +
               "(up to <a href=\"#plot\">plot</a>)<br />&nbsp;<br />" +
                "<div class='selectorPanel' style='width:1800px; height:850px;'>" + //@todo - being ignored...
               "<table border='1' width=95%>";

  // posting detail
  slice.forEach(function (d) {
//    info += "<tr><td width=10%><b><i>Date posted or first seen</i></b> </td><td width=65%>" +
//                ((d.datePosted != null) ? formatDateby(d.datePosted) : formatDateby(d.firstSeen)) + "</td></tr>";
    info += "<tr><td width=10%><b><i>Job Title</i></b> </td><td width=65%>" + d.title + "</td></tr>";
    info += "<tr><td width=10%><b><i>Description</i></b> </td><td width=65%>" + truncate(d.description, 500, "... ") +
  //                        "<br/><a href='" + d.url "'>(MORE DETAIL ..." + ")</a>") +
                "</td></tr>";
    info += "<tr><td width=10%><b><i>Term frequency</i></b> </td><td width=65%>" + d[term]+ "</td></tr>";
    info += "<tr><td width=10%><b><i>Data source</i></b> </td><td width=65%>" + d.dataSourceId + "</td></tr>";
    info += "<tr><td colspan='2'></td></tr>";
  });
  // end posting detail

  info += "</table></div>";// +
            //"<br />&nbsp;<br />(back up to <a href=\"#plot\">plot</a>)<br />";

  return info;
}

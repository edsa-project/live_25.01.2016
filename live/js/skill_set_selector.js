var skillSetCounts = skillCounts = [];
var termFrequencyMedian = termFrequencyMax = termFrequencySum = [];


function buildSkillsetPanel(divId, skillSets, initAllSelected, inputData) {
  if (inputData)  // need to double-check this - breaks if not set, despite checks
    setSkillSelectorMetadata(skillSets, inputData);
  var skillCount;
  var skillSetComplete;

  divId = "#" + divId;

  d3.select(divId)
    .append("text")
    .style("font-size", "14px")
    .style("font-weight", "medium")
    .text("SKILLSETS")
    .append("p");

  d3.select(divId)
    .selectAll("div")
    .data(Object.keys(skillSets)) // map - key: label; values: skills
    .enter()

    // outer div used for show-hide
    .append("div")
    .attr("class", "selector-box")
//    .style("backgound", "red")//function (d) { return skillSetsColourCodesLib(getSkillSetLabelFromMap(d, skillSets)); })
//    .style("border", function (d) { return ("1px solid " + skillSetsColourCodesLib(getSkillSetLabelFromMap(d, skillSets))); })
    .each(function (d) {
      d3.select(this)
        .append("span")
        .attr("id", ("div_label_" + d))
        .style("font-weight", "bold")
        .style("display", "none")
        .text("\u2004 + \u2004" + d.replace(/_/g, " ").toUpperCase()) // \u25BC/A
//        .text(function (d) { return "<a onmousedown='showHideRegion(div_" + d + ", div_label_" + d + ")'  href='javascript:;'>\u25BC</a> " + d.replace(/_/g, " ").toUpperCase(); } )
    })
//    .on("mousedown", function (d) { // there's some pause... annoying...// need to use mousedown or click below isn't recognised...
      // having said that... mousedown is affecting the entire div... will need to retest...
//      showHideRegion("div_" + d, "div_label_" + d);
//    })
    .on("dblclick", function (d) {
      showHideRegion("div_" + d, "div_label_" + d);
    })

    // div containing each skillset
    .append("div")
    .attr("id", function (d) { return "div_" + d; } )
    .append("p")
    .each(function (d) {

      skillSetComplete = initAllSelected;
      if (inputData)
        for (var k = 0; k < skillSets[d].length; k++) {
          if ((skillCount = skillCounts[d][k]) == 0) {
            skillSetComplete = false;
            break;
          }
        }

      // skillSet label
      d3.select(this).append("span")
        .style("font-weight", "bold")
        .text("\u2009\u2014\u200A")
        .on("mouseover", function(d) {
          d3.select(this)
          .style("cursor", "grab")
        })
        .on("click", function () { // there's some pause... annoying...
          showHideRegion("div_" + d, "div_label_" + d);
        });
      d3.select(this)
        .append("input")
        .attr("type", "checkbox")
        .attr("id", d)
        .attr("checked", ((initAllSelected && skillSetComplete) ? true : null)) // doesn't recognise false...
        .attr("class", "skillSet")
        .on("click", function () {
          filterPlot(this, skillSets[d]);
        })
      d3.select(this).append("span")
        .style("font-weight", "bold")
        .text(function() { skillCount = d3.sum(skillSetCounts[d]);
                              return (d.replace(/_/g, " ").toUpperCase() +
                                    ((inputData && (skillCount > 0)) ? " (" + skillCount + ")": "")); } )
//        .style("color", function (d) { return skillSetsColourCodesLib(getSkillSetLabelFromMap(d, skillSets)); })
        .append("br");

      // and skills
      for (var k = 0; k < skillSets[d].length; k++) {
        if (inputData)
          skillCount = skillCounts[d][k];

        d3.select(this)
          .append("input")
          .attr("type", "checkbox")
          .attr("id", (d + defaultDelimiter + skillSets[d][k]) )
          .attr("checked", ((initAllSelected && (skillCount > 0)) ? true : null)) // doesn't recognise false...
          .style("margin-left", "24px")
          .attr("class", "skill")
          .on("click", function () {
            filterPlot(this);
          });
        d3.select(this).append("span")
          .style("color", (((initAllSelected && !inputData) || (skillCount > 0)) ?
                                                       colourCodes.lato_dark_blue5 : //skillSetsColourCodesLib(getSkillSetLabelFromMap(skillSets[d][k], skillSets)) :
                                                        colourCodes.colourMeInactive) )
          .text(skillSets[d][k].toLowerCase().replace(/_/g, " ") +
                                       ((inputData && (skillCount > 0)) ? " (" + skillCount + ")": "") )
          .append("br");
      }
  });
}

function setSkillSelectorMetadata(skillSets, inputData) { // include metadata, e.g., counts on labels... - key: skill/skillset, value: metadata
  var termFrequencyMedian = termFrequencyMax = termFrequencySum = [];

  Object.keys(inputData).forEach(function(g) {
    termFrequencyMedian[g] = d3.median(inputData[g]);
    termFrequencyMax[g] = d3.max(inputData[g]);
    termFrequencySum[g] = d3.sum(inputData[g]);
  });

  var skillLabel;
  Object.keys(skillSets).forEach(function (skillSet) {
    if (!skillSetCounts[skillSet])
      skillSetCounts.push(skillSetCounts[skillSet] = []);

    skills[skillSet].forEach(function (skill) {

      if ((skillLabel = getContainedElement(Object.keys(termFrequencySum), skill, true)) != null) {
        skillCounts[skill] = termFrequencySum[skillLabel];
        skillSetCounts[skillSet].push(termFrequencySum[skillLabel]);
      }
//        console.log(skill + ": " + skillCounts[skill])
    });

//      console.log(skillSet + ": " + d3.sum(skillSetCounts[skillSet]))
  });
}

function updateSkillSelectorMetadata(inputData) { // include metadata, e.g., counts on labels... - key: skill/skillset, value: metadata
  var termFrequencyMedian = termFrequencyMax = termFrequencySum = [];

  Object.keys(inputData).forEach(function(g) {
    termFrequencyMedian[g] = d3.median(inputData[g]);
    termFrequencyMax[g] = d3.max(inputData[g]);
    termFrequencySum[g] = d3.sum(inputData[g]);
  });

  d3.selectAll(".skillSet").forEach(function (skillSetPanel) {

    skillSetPanel.forEach(function (skillSet) {
      if (!skillSetCounts[skillSet.id]) {
        skillSetCounts[skillSet.id] = [];
        skillSetCounts.push(skillSetCounts[skillSet.id]);
      }

      var g = d3.select(skillSet).node();
      var g_skill = d3.select(g.parentNode)
                      .selectAll(".skill");

        g_skill.forEach(function (skillPanel) {

          skillPanel.forEach(function(skill) {
            var skillLabel = (skill.id).substring((skill.id).lastIndexOf(defaultDelimiter) + 1);

            if ((skillLabel = getContainedElement(Object.keys(termFrequencySum), skillLabel, true)) != null) {
              skillCounts[skill.id] = termFrequencySum[skillLabel];
              skillSetCounts[skillSet.id].push(termFrequencySum[skillLabel]);

              //@todo - update UI - skill counts
            }

          }); // end iterate over skills
        }); // end iterate over skillPanels

      //@todo - update UI - skillset counts
   }); // end iterate over skillSets
 });
}

function filterPlot(itemSelected, skillSet) {
  updateSelectorPanel(itemSelected, skillSet);
  applyFilter(itemSelected, skillSet);  //define as required by each widget or plot
}

function updateSelectorPanel(itemSelected, skillSet) {
  var g = d3.select(itemSelected).node().parentNode;

  if (skillSet) { // cascade...
    d3.select(g).selectAll(".skill")
                .property("checked", (itemSelected.checked ? true : false));  // attr doesn't work properly...

  } else {
    var parent = d3.select(g).select(".skillSet");

    if (itemSelected.checked) {
      var set = d3.select(g).selectAll(".skill");
//      set.each(function(d) {  // returns parent label

      set.forEach(function(d) { // need to iterate twice - first into top-level array/holder, then to select individual elements
        var allSelected = true;

        d.forEach(function(k) {
          if (allSelected) // only need to reset once... but cannot break out of loop...
            allSelected = k.checked;
        }); // end check for toggle skillSet label...
        parent.property("checked", allSelected);

      });
    } else
      parent.property("checked", itemSelected.checked);  // should be false
  }
}

function updateSelectorPanelItem(selectedItemId, setSelected) {
  var skillLabel;
  var allInSkillSetSelected;
  var parentSkillSet;
  var g = d3.selectAll(".skillSet");

  g.forEach(function(d) {
    d.forEach(function(skillSet) {
      if (skillSet.id.toLowerCase() === selectedItemId.toLowerCase())
        d3.select(skillSet).property("checked", setSelected);

      else if (parentSkillSet == null) {  // check children...
        var set = d3.select(skillSet).node().parentNode;
        set = d3.select(set).selectAll(".skill")

        set.forEach(function(skills) {
          allInSkillSetSelected = true;

          skills.forEach(function(skill) {
            skillLabel = skill.id;
            skillLabel = skillLabel.substring(skillLabel.lastIndexOf(defaultDelimiter) + 1);

            if (skillLabel.toLowerCase() === selectedItemId.toLowerCase()) {
              d3.select(skill).property("checked", setSelected);

              parentSkillSet = skillSet;
            }
             if (allInSkillSetSelected) // check only till switched...
               allInSkillSetSelected = skill.checked;
         });  // individual skill detail
        }); // end - iteration through skill objects

        if (parentSkillSet != null)  // cascade upward if need be...
          d3.select(parentSkillSet).property("checked", allInSkillSetSelected);
        // end update check

      } // end if-else - check for skillSet label or skills contained
    }); // end - iteration through skillSet labels
  }); // end - (initial) iteration through skillSet container
}

// adapted from http://jsfiddle.net/zhanghuancs/cuYu8
function buildSkillsetFilter(divId, selectedSkillSet, replaceContents) {
  divId = "#" + divId;

  if (replaceContents) {
    d3.select(divId)
      .selectAll("div")
      .data("")
      .exit().remove();
  }

  d3.select(divId)
    .selectAll("div")
    .data(selectedSkillSet)
    .enter()
    .append("div")
    .attr("class", "selector-box")  //"checkbox-container")
    .append("label")
    .each(function (d) {
      d3.select(this)
        .append("input")
        .attr("type", "checkbox")
        .attr("id", function (d) { return d; } )
//            .attr("checked", false) // doesn't recognise false...
        .on("click", function (d, i) {
//              filterGraph(d, (this.checked ? "visible" : "hidden"));// @tod - set up
        });
      d3.select(this).append("span")
        .text(function (d) { return d; } );
  });
} // end function buildSkillsetFilter

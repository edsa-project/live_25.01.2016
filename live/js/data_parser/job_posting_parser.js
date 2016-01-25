/*
 * sample input
 */

var numericHeaders = [];
var colourMappings = [];

var summaries = [],
    termFrequencyMax, termFrequencyMedian;
var medianFrequencyLabel = "Median frequency",
    maxFrequencyLabel = "Max frequency";

var minFrequency = maxFrequency = 0;
var datePostedEmpty = true,
    firstSeenEmpty = true,
    lastSeenEmpty = true;
var minValidDate = Date.now(),
    maxValidDate = new Date(0);


function parseInput(jobPostings, skillSets) {
}


function setupColourCoding(skillSets) {

  var colourCodesDomain = [];

  Object.keys(skillSets).forEach(function (skillSet) {
    colourCodesDomain.push(skillSet);
    if (!colourMappings[skillSet])
      colourMappings.push(colourMappings[skillSet] = []);

    skillSets[skillSet].forEach(function (skill) {
      colourMappings[skillSet].push(skill);
    });
  });

  colourCodesDomain = d3.set(colourCodesDomain).values();

  var cDomain = [], cRange = [],
      colourSelector = [ "#8c857d",  // Taupe (advanced_computing)
                          "#d982ab", // Pink (data_skills)
                          "#d9525e", // Peachy red (domain_expertise)
                          "#a63f52", // D. red (general)
                          "#8c6976", // Plum (machine_learning)
                          "#55b1b1", // Turquoise (math_and_statistics)
                          "#637e9e", // Blue (visualisation)

                           ];
//                        d3.merge([ // set full first as may need to extend range...
////                                  colorbrewer.Spectral[11],
////                                  colorbrewer.Accent[8],
////                                  colorbrewer.GnBu[9],  //YlOrBr[9],
////                                  colorbrewer.PuBuGn[9],
//                                  colorbrewer.PuOr[9],
////                                  colorbrewer.Set3[12],
//                                ]);

  cRange = colourSelector;
  cDomain = colourCodesDomain;

  return d3.scale.ordinal()
                 .range(cRange)
                 .domain(cDomain);
}

function getSkillSetLabel(skill, skillSets) {
  if (colourMappings.length === 0)
    setupColourCoding(skillSets);

  var skillSetLabel;

  Object.keys(colourMappings).forEach(function (skillSet) {
    // don't know how numbers filled the map... guess it's the annoying javascript default thing, but makes no sense when I'm explicitly setting keys...
    if ((skillSetLabel == null) && contains(skillSets, skillSet, true)) { // don't get this - skillSets shd be keys...

      colourMappings[skillSet].forEach(function (currentSkill) {
        if (currentSkill === skill)
          skillSetLabel = skillSet;
      });
    }  // end bypass = check for null
  });

  return skillSetLabel;
}

//@todo - double-check and merge this with orig
// this is where the insanity of pseudo OO languages makes no sense... the same object simply changes structure
// by being read directly into a function, with NO EDITING, just read!
function getSkillSetLabelFromMap(skill, skillSets) {
  if (colourMappings.length === 0)
    setupColourCoding(skillSets);

  var skillSetLabel, tmp;
  // don't know how numbers filled the map... but here it's the actual objects... :@ :@ :@

  if (!skillSetLabel) {
    if ((tmp = getContainedElement(Object.keys(skillSets), skill, true)) != null) {
        skillSetLabel = tmp;
      }
  } if (!skillSetLabel) { // not yet set...
    Object.keys(colourMappings).forEach(function (skillSet) {
    if ((skillSetLabel == null) && contains(Object.keys(skillSets), skillSet, true)) {

       colourMappings[skillSet].forEach(function (currentSkill) {
          if (currentSkill === skill)
            skillSetLabel = skillSet;
        });
      }  // end if- bypass = check for null
    });
  }

  return skillSetLabel;
}


function typeData(d) {
//  var dateDescr;

  if (d.date)
    d.date = formatDateYmd.parse(d.date);

  else if (d.datePosted && (d.datePosted.trim() != "")) {
    d.date = d.datePosted = isoDateFormat.parse(d.datePosted);
    dateDescr = "d.datePosted";

  } else if (d.firstSeen && (d.firstSeen.trim() != "")) {
    d.date = d.firstSeen = isoDateFormat.parse(d.firstSeen);
    dateDescr = "d.firstSeen";

  } else if (d.lastSeen && (d.lastSeen.trim() != "")) {
    d.date = d.lastSeen = isoDateFormat.parse(d.lastSeen);
    dateDescr = "d.lastSeen";

  } else
    d.date = new Date(-1);  // @todo- will this break parsing?

//  if (!dateDescr) {
//  console.log(dateDescr)
//    if (dateDescr === "d.datePosted")
//      d.datePosted = new Date(-1);
//    else if (dateDescr === "d.firstSeen")
//      d.firstSeen = new Date(-1);
//    else if (dateDescr === "d.lastSeen")
//      d.lastSeen = new Date(-1);
//  }

  Object.keys(d).forEach(function(dataPoint) {
    // @todo - can't use typeof  nor instance of nor even a check after using '+' to convert - latter always returns 'number'!!!!!

    //if (!((d[dataPoint] instanceof Date)) &&
    if (contains(numericHeaders, dataPoint, true))
      d[dataPoint] = +d[dataPoint];
  });

  return d;
}

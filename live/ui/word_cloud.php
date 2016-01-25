<!DOCTYPE html>
<html>
  <head lang="en">
    <meta charset="UTF-8">
    <title></title>

    <link rel="stylesheet" href="../common/stylefiles/dashboard.css" type="text/css" />
    <style type="text/css">
    </style>
  </head>

  <body>
    <p id="output"></p>

    <div id="legend"></div>
    <div id="dashboard">
      <table>
        <tr>
          <!-- td width="200"><div id="selectorPanel"
                                style="overflow: auto; width: 200px; height: 800px; border: 3px solid #336699; padding-left: 5px"
                                ></div</td -->
          <!-- td colspan="2" -->
					<td><div id="plot" class="plot" style="border-radius:5px; border-style: solid; border-color:maroon; border-width: 1px;"></div></td>
          <!-- td valign="top" style="padding-left: 25px;">
    <a name="selectionHeader"></a>
    <div><h4 id="selectionHeader"></h4>
      <div id="indicatorSelectionList"></div>
    </div>
    <a name="selectionDetail"></a>
    <div id="selectionDetail">
    </div>
          </td -->
        </tr>
      </table>
    </div>

    <div id="test" style="display: none;" >
      // display command ignored for scripting sections but even commented out works for php - but need to hide php comments...

      <?php
        include '../php/data_parser.php';
        setDataFolders("../../data/skillsets/");
				$languageFilter = array( "hu", "gb", "fr", "random", "el" );
      ?>
    </div>


    <script src="../common/libs/js/ext/d3.v3.min.js"></script>
    <script src="../common/libs/js/ext/colorbrewer.js"></script>
    <script src="../common/libs/js/ext/queue.min.js"></script>
    <script src="../common/libs/js/ext/underscore.js"></script>
    <script src="../common/libs/js/ext/d3.layout.cloud.js"></script>

    <script src="../common/libs/js/common.js"></script>
    <script src="../js/common.js"></script>
    <!-- script src="../js/skill_set_selector.js"></script -->
    <script src="../js/data_parser/job_posting_parser.js"></script>
    <script src="../js/data_table.js"></script>
    <script src="../js/word_cloud.js"></script>

    <script>

      var parsedDirs =  JSON.parse('<?php echo str_replace('\"', "", json_encode(getDataFilesFromDefault($languageFilter))); ?>');

      var countryMetadata = JSON.parse('<?php echo json_encode(getDefaultCountryMetadata($languageFilter)); ?>');


      var dataFile,
          languageCodes = JSON.parse('<?php echo json_encode($GLOBALS[languageCodes]); ?>'), // will eventually need to user a parser to countryIds in jobs_short.csv, for instance//null, //[ "UK", "France", "Germany" ],
          skillSets = Object.keys(parsedDirs),
          skills = new Array(),
          languageOfInterest,  // = languageCodes[10], // currently gb, fr == 10
          indexOfInterest = skillSets[skillSets.length - 1];


      var defaultDir = JSON.parse('<?php echo json_encode($defaultOutputDir); ?>'),
          defaultFileSuffix = JSON.parse('<?php echo json_encode($defaultSuffix); ?>');

      var languageFilter = new Array();
      skillSets.forEach(function(d) {

        Object.keys(parsedDirs[d]).forEach(function(language) {
          if (!contains(languageFilter, language))
            languageFilter.push(language);

          // need a default till set up to select ...
          if (!languageOfInterest)
            languageOfInterest = languageFilter[1]; // gb

          if (language === languageOfInterest)
            skills[d] = parsedDirs[d][language]; // annoyingly cannot break out...
        });
      });

      dataFile = defaultDir +
                    /*d*/ indexOfInterest + "/" +
                    languageOfInterest +
                    defaultFileSuffix

      dataFile = "../../data/job_postings/Indeed-2015-11-11.csv"

      drawWordCloud(dataFile, defaultDelimiter, skills);//, true /*matchDataTableHeight*/);
      printOutput();


    </script>


    <a name="selectionHeader"></a>
    <div><h4 id="selectionHeader"></h4>
      <div id="indicatorSelectionList"></div>
    </div>
    <a name="selectionDetail"></a>
    <div id="selectionDetail">
    </div>

  </body>
</html>

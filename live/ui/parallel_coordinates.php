<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title></title>
   <link rel="stylesheet" href="../common/stylefiles/dashboard.css" type="text/css" />

  </head>

  <body>
    <p id="output"></p>
    <!-- div id="plot"></div>
    <div id="legend"></div -->
    <div id="dashboard">
      <table>
        <!-- th class="edsa_banner" colspan=2 style="text-align: left; padding: 15px;">
          <table>
            <tr>
              <td><img src="../../../icons/edsa-logo.png" height="40" alt="EDSA logo" /></td>
              <td style="padding-left:20px; font-size:225%;"><div>EDSA demand analysis dashboard</div></td>
            </tr>
          </table>
        </th-->
        <tr>
          <td width="220"><div id="selectorPanel"class="selectorPanel" style='width:355px; font-size:12px;'></div></td>
          <td><div id="plot" class="plot" style="border-radius:5px; border-style: solid; border-color:maroon; border-width: 1px;"></div></td>
        </tr>
      </table>
    </div>

    <div id="test" style="display: none;" >
      // display command ignored for scripting sections but even commented out works for php - but need to hide php comments...

      <?php
        include '../php/data_parser.php';
        setDataFolders("../../data/skillsets/");
        $languageFilter = array( "hu", "gb", "fr", "random", "el" );
//        include '../php/skill_set_data_loader';
      ?>
    </div>

    <script src="../common/libs/js/ext/d3.v3.min.js"></script>
    <script src="../common/libs/js/ext/render-queue.js"></script>
    <script src="../common/libs/js/ext/colorbrewer.js"></script>
    <script src="../common/libs/js/ext/underscore.js"></script>

    <script src="../common/libs/js/common.js"></script>
    <script src="../js/common.js"></script>
    <script src="../js/skill_set_selector.js"></script>
    <!-- script src="../js/data_parser/skillset_parser.js"></script -->
    <script src="../js/data_parser/job_posting_parser.js"></script>

    <script src="../js/parallel_coords_queued_rendering.js"></script>
    <script>

      //@todo - move parsing into separate file...
      var parsedDirs =  JSON.parse('<?php echo str_replace('\"', "", json_encode(getDataFilesFromDefault($languageFilter))); ?>');

      var countryMetadata = JSON.parse('<?php echo json_encode(getDefaultCountryMetadata($languageFilter)); ?>');

      var dataFile,
          languageCodes = JSON.parse('<?php echo json_encode($GLOBALS[languageCodes]); ?>'), // will eventually need to user a parser to countryIds in jobs_short.csv, for instance//null, //[ "UK", "France", "Germany" ],
          skillSets = Object.keys(parsedDirs),
          skills = new Array(),//[],
          languageOfInterest,  // = languageCodes[10], // currently gb, fr == 10
          indexOfInterest = skillSets[skillSets.length - 1];

      var defaultDir = JSON.parse('<?php echo json_encode($defaultOutputDir); ?>'),
          defaultFileSuffix = JSON.parse('<?php echo json_encode($defaultSuffix); ?>');

      var languageFilter = new Array();//[];
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

      //-end parsing

      dataFile = //"../../edsa_demand_analysis/dashboard/data/data_extraction/detail_term_frequencies1445227289463.csv";
                  "../../data/job_postings/Indeed-2015-11-11.csv";

      skillSetsColourCodesLib = setupColourCoding(skills);

      var suppressedHeaders = [ /*"datePosted",*/ "firstSeen", "identifier", "dataSourceId", "industry", "requiredLanguage", "hiringOrganization", "jobLocation", "geoLocation", "description", "title" , "minValue", "maxValue" ];
      drawParallelCoordinates(dataFile, defaultDelimiter, skills, suppressedHeaders);

      printOutput();
    </script>


    <div><h4 id="selectionHeader"></h4>
      <div id="indicatorSelectionList"></div>
    </div>
    <a name="selectionDetail"></a>
    <div id="selectionDetail">
    </div>

  </body>
</html>


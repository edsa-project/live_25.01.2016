/** borrows from https://github.com/davetaz/EDSA/blob/gh-pages/harvester.php */
/** EDSA server uses php 5.3.3 ... */

<?php

  $defaultTopLevelDataFolder = "../data/";
  $defaultSearchTermsDir = "harvester/search_terms/";
  $defaultOutputDir = "harvester/search_results/linkedin/";
  $defaultCountryMetadataFile = "eu-country-languages.csv";
  $defaultSuffix = ".csv";

//  $topLevelSearchTerms = getDataFiles($defaultSearchTermsDir, $defaultOutputDir);
  $languageCodes = array();//[];

  function setDataFolders($topLevelDataFolder) {
    if (is_null($topLevelDataFolder))// == null)
      $topLevelDataFolder = $GLOBALS[defaultTopLevelDataFolder];

    $GLOBALS[defaultSearchTermsDir] = $topLevelDataFolder . $GLOBALS[defaultSearchTermsDir];
    $GLOBALS[defaultOutputDir] = $topLevelDataFolder . $GLOBALS[defaultOutputDir];
    $GLOBALS[defaultCountryMetadataFile] = $topLevelDataFolder . $GLOBALS[defaultCountryMetadataFile];
  }

  function getDefaultCountryMetadata($languageFilter) {
    return getCountryMetadata($defaultCountryMetadataFile, $languageFilter);
  }

  function getCountryMetadata($metadataFile, $languageFilter) {
    //name,ISO2,id,Language
    $countryNameIndex = -1;
    $iso2Index = -1;
    $countryIdIndex = -1;
    $languageIndex = -1;

    if (!isset($metadataFile) || trim($metadataFile) == "")
      $metadataFile = $GLOBALS[defaultCountryMetadataFile]; //"../data/eu-country-languages.csv";

    $countryMetadata = file($metadataFile);
    $metadata = array();//[];

    $tmp = explode(",", $countryMetadata[0]);
    $headers = array_fill_keys($tmp, "");

    for ($i = 0; $i < count($tmp); $i++) {
      if (array_key_exists($tmp[$i], $headers)) {
        $headers[$tmp[$i]] = $i;

        if (trim($tmp[$i]) === "name")
          $countryNameIndex = $i;
        else if (trim($tmp[$i]) === "ISO2")
          $iso2Index = $i;
        else if (trim($tmp[$i]) === "id")
          $countryIdIndex = $i;
        else if (trim($tmp[$i]) === "Language")
          $languageIndex = $i;
     }
    } // end for

    // need to recreate objects - php 5.3.3 - arrays are a nightmare...
    $countryNameKey = array_keys($headers);
    $countryNameKey = trim($countryNameKey[$countryNameIndex]);

    $iso2Key = array_keys($headers);
    $iso2Key = trim($iso2Key[$iso2Index]);

    $countryIdKey = array_keys($headers);
    $countryIdKey = trim($countryIdKey[$countryIdIndex]);

    $languageKey = array_keys($headers);
    $languageKey = trim($languageKey[$languageIndex]);


    for ($i = 1; $i < count($countryMetadata); $i++) {

      $dataValues = explode(",", $countryMetadata[$i]);


      if (($countryName = trim($dataValues[$countryNameIndex])) !== null) {
        if ( (($language = trim($dataValues[$languageIndex])) !== null) &&
            in_array($language, $languageFilter)) {

          $metadataHolder = array(
                              $countryNameKey => $countryName, //name
                              $iso2Key => $dataValues[$iso2Index], //ISO2
                              $countryIdKey => $dataValues[$countryIdIndex], //id
                              $languageKey => $language //Language
                              );
          $metadata[$countryName] = $metadataHolder;
        }
      }
    }

    return $metadata;
  }

  function getDataFilesFromDefault($languageFilter) {
    return getDataFiles($defaultSearchTermsDir, $defaultOutputDir, $languageFilter); // cannot get why this prefixes array with 1 ...
  }

  function getDataFiles($searchTermsDir, $resultsDir, $languageFilter) {
    if (!isset($searchTermsDir) || trim($searchTermsDir) == "")
      $searchTermsDir = $GLOBALS[defaultSearchTermsDir]; //"../data/harvester/search_terms/";
    if (!isset($resultsDir))
      $resultsDir = $GLOBALS[defaultOutputDir];  //"../data/harvester/search_results/linkedin/";

    $files = scandir($searchTermsDir);
    $extractedTerms = array();//[];

    for ($i = 2; $i < count($files); $i++) {  // need to skip directory :S listings (. & ..)

      $subSearchTerms = array();//[];
      $count = 0;
      $file = $searchTermsDir . $files[$i];

      $file_handle = fopen($file, "r"); //need to parse so file(fileName) not useful
      while (!feof($file_handle)) {
        if ($count == 0) {
          $languageCodeHeaders = trim(fgets($file_handle));
          $GLOBALS[languageCodes] = array_merge($GLOBALS[languageCodes], $languages = explode(",", $languageCodeHeaders));

          if ((is_null($languageFilter)) || (count($languageFilter) == 0))
            $subSearchTerms = array_fill_keys($languages, array());//[]);
          else //if (in_array($languageFilter, $languages))
            $subSearchTerms = array_fill_keys(array_intersect($languageFilter, $languages), array());//[]);

        } else if (strlen($term = trim(fgets($file_handle))) > 0) {
//          array_push($subSearchTerms, explode(",", $term)); // don't want keys (?countries?)
          $tmp = explode(",", $term);
          for ($j = 0; $j < count($tmp); $j++) {
            if (is_null($languageFilter) || array_key_exists($languages[$j], $subSearchTerms))
              array_push($subSearchTerms[$languages[$j]], $tmp[$j]);
          }
        }

        $count++; // any other way will come out b4 printing last
      }
      fclose($file_handle);

      $GLOBALS[languageCodes] = array_unique($GLOBALS[languageCodes]);

      $extractedTerms[substr($files[$i], 0, -4)] = $subSearchTerms;


      $resultBatch = $resultsDir . substr($files[$i], 0, -4); // @todo - replace with suffix call
      $output_files = scandir($resultBatch);
    }

   return $extractedTerms;
  }

?>

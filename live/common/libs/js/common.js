var defaultDelimiter = "|";
var output = "";


var formatDatedmY = d3.time.format("%d-%m-%Y"),
    formatDatedm = d3.time.format("%d-%m"),
    formatDateYmd =  d3.time.format("%Y-%m-%d"),
    formatDateYmdCompact = d3.time.format("%Y%m%d"),
    formatDateDbY  = d3.time.format("%d %b %Y"),
    formatDateDbyS  = d3.time.format("%d %b %y"),
    formatDateDby  = d3.time.format("%d-%b-%y"),
    formatDatebY  = d3.time.format("%b %Y")
    formatDateby  = d3.time.format("%b-%y")
    isoDateFormat = d3.time.format("%Y-%m-%dT%H:%M:%S");

var formatInteger = d3.format("d");

//var colourCodesLib = //d3.scale.category20c();
//                    d3.scale.ordinal()
//                      .range(
//                      d3.merge([
//                //                              colorbrewer.RdYlBu[10],
//                        colorbrewer.RdYlBu[11],
//                        colorbrewer.Pastel1[8],
//                        colorbrewer.Spectral[11],
//                        colorbrewer.Accent[8],
//                        colorbrewer.RdYlGn[11],
//                      ]));



// "printer" functions

function appendToOutput(data) {
  return (output += "<p>" + data + "</p>");
}

function printOutput() {
  document.getElementById("output").innerHTML = output;
}


// helper functions

function stringSort(itemA, itemB, delimiter) { // allows this to be used for sorting multi-part strings
  if (!delimiter)
    delimiter = " ";
  else if (delimiter == true) // don't split (false == null so can't use)
    delimiter = "\|"

  var parsedItemA = itemA.split(delimiter),
      parsedItemB = itemB.split(delimiter),
      itemBaseA = (parsedItemA.length > 1) ? parsedItemA[parsedItemA.length - 1].trim() : "",//parsedItemA[0],
      itemBaseB = (parsedItemB.length  > 1) ? parsedItemB[parsedItemB.length - 1].trim() : "",//parsedItemB[0],
      itemSpecifierA = parsedItemA[0].trim(),
      itemSpecifierB = parsedItemB[0].trim();
console.log(itemSpecifierA + " - " + itemSpecifierB + " - " + itemBaseA + " - " + itemBaseB);

  if (itemBaseA < itemBaseB)
    return -1;
  else if (itemBaseA > itemBaseB)
    return  1;
  else if (itemSpecifierA < itemSpecifierB)
    return -1;
  else if (itemSpecifierA > itemSpecifierB)
    return  1;
  else
    return 0;
}

function sortOnDualProperty(propertyA1, propertyB1, propertyA2, propertyB2) {
  if (propertyB1 > propertyA1)
    return 1;
  else if (propertyB1 < propertyA1)
    return  -1;
  else
    return (propertyA2 < propertyB2);
}

function sortOnProperty(elementA, elementB, propertyA, propertyB) {
  if (propertyA > propertyB)  // reverse sort...
    return -1;
  else if (propertyA < propertyB)
    return  1;
  else if (elementA < elementB)
    return -1;
  else if (elementA > elementB)
    return  1;
  else
    return 0;
}


function contains(dataStructure, searchElement, ignoreCase) {
  var i = dataStructure.length;

  while (i--) {
    if (dataStructure[i] === searchElement)
      return true;
    if (ignoreCase && (dataStructure[i].toLowerCase() === searchElement.toLowerCase()))
      return true;
  }

  // don't get this - fails for 2nd instance of same element for which it previously passes...
  //      dataStructure.forEach(function (element) {
  //        if (element === searchElement) {
  //          console.log("test = T: " + element + " - " + searchElement);
  //
  //          return true;
  //      }
  //      })
  //
  return false;
}

function containsAnyOf(dataStructure, searchElements, ignoreCase) {
  var i = dataStructure.length;

  while (i--) {
    if (contains(searchElements, dataStructure[i], ignoreCase))
      return true;
  }
}

function getContainedElement(dataStructure, searchElement, ignoreCase) {
  var i = dataStructure.length;

  while (i--) {
    if (dataStructure[i] === searchElement)
      return dataStructure[i];
    if (ignoreCase && (dataStructure[i].toLowerCase() === searchElement.toLowerCase()))
      return dataStructure[i];
  }

  // don't get this - fails for 2nd instance of same element for which it previously passes...
  //      dataStructure.forEach(function (element) {
  //        if (element === searchElement) {
  //          console.log("test = T: " + element + " - " + searchElement);
  //
  //          return true;
  //      }
  //      })
  //
  return null;
}

/*
 * allow case-insensitive search...
 */
function indexOf(dataStructure, searchElement, ignoreCase) {
  for (var i = 0; i < dataStructure.length; i++) {
console.log("in: " + dataStructure[i])
    if (dataStructure[i] === searchElement)
      return i;
    if (ignoreCase && (dataStructure[i].toLowerCase() === searchElement.toLowerCase()))
      return i;
  }

  return -1;
}

function truncate(str, maxLength, suffix) {
  if(str.length > maxLength) {
    str = str.substring(0, maxLength + 1);
    str = str.substring(0, Math.min(str.length, str.lastIndexOf(" ")));
    str = str + suffix;
  }
  return str;
}

function showHideRegion(link, label) {
  var region = document.getElementById(link),
      regionLabel = document.getElementById(label);
  if (!region)
    return true;

  if (region.style.display == "none") {
    region.style.display = "block";
    regionLabel.style.display = "none";
  } else {
    region.style.display = "none";
    regionLabel.style.display = "block";
  }

  return true;
}

/** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every
  * ... every was added to the ECMA-262 standard in the 5th edition; as such it may not be present in other implementations of the standard...
  */
// if (!Array.prototype.every) {
Array.prototype.every = function(callbackfn, thisArg) {
  'use strict';
  var T, k;

  if (this == null)
    throw new TypeError('this is null or not defined');

  // 1. Let O be the result of calling ToObject passing the this
  //    value as the argument.
  var O = Object(this);

  // 2. Let lenValue be the result of calling the Get internal method
  //    of O with the argument "length".
  // 3. Let len be ToUint32(lenValue).
  var len = O.length >>> 0;

  // 4. If IsCallable(callbackfn) is false, throw a TypeError exception.
  if (typeof callbackfn !== 'function')
    throw new TypeError();

  // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
  if (arguments.length > 1)
    T = thisArg;

  // 6. Let k be 0.
  k = 0;

  // 7. Repeat, while k < len
  while (k < len) {

    var kValue;

    // a. Let Pk be ToString(k).
    //   This is implicit for LHS operands of the in operator
    // b. Let kPresent be the result of calling the HasProperty internal
    //    method of O with argument Pk.
    //   This step can be combined with c
    // c. If kPresent is true, then
    if (k in O) {

      // i. Let kValue be the result of calling the Get internal method
      //    of O with argument Pk.
      kValue = O[k];

      // ii. Let testResult be the result of calling the Call internal method
      //     of callbackfn with T as the this value and argument list
      //     containing kValue, k, and O.
      var testResult = callbackfn.call(T, kValue, k, O);

      // iii. If ToBoolean(testResult) is false, return false.
      if (!testResult)
        return false;
    }
  k++;
  }
  return true;
};

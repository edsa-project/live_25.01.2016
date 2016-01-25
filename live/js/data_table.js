/*
 * adapted from: https://gist.github.com/jfreels/6814721
 */

function drawDataTableFromJson(data, dataHeaders, outputElementId, overrideHeight) {
	// hard-coding for now...
 	dataHeaders = ["identifier", /*"datePosted",*/ "title" , "hiringOrganization", "jobLocation", /*"countryCode", "description"*/ ];//d3.keys(data);

	clearTable(data, outputElementId);
	tabulate(data, dataHeaders, outputElementId, overrideHeight);
}

function drawDataTable(identifiers, dataHeaders, outputElementId, overrideHeight) {
	var data = lookup(identifiers, dataHeaders)

	clearTable(data, outputElementId);
	tabulate(data, dataHeaders, outputElementId, overrideHeight);
}

function drawDataTableFromDsv(dataFile, fileDelimiter, suppressedHeaders, outputElementId, overrideHeight) {

  var dsv = d3.dsv(fileDelimiter, "text/utf-8");  // plain
  dsv(dataFile, function(error, data) {
		if (error)
			return console.error(error);

  	var dataHeaders = d3.keys(data[0]);
  	dataHeaders = _.difference(dataHeaders, suppressedHeaders);
			console.log(dataHeaders)

		data.forEach(function (d, i) {
			//2015-05-13T01:21:07
			if (d.datePosted.trim() != "")
				d.datePosted = isoDateFormat.parse(d.datePosted);
		});

		tabulate(data, dataHeaders, outputElementId, overrideHeight);
	});
}

function clearTable(data, outputElementId) {
	//d3.select doesn't have access to previous data... unless same (re)selected
	if (outputElementId.startsWith("#"))
		outputElementId = outputElementId.substring(1);

	var currentTable = document.getElementById(outputElementId);
	if (currentTable)
		currentTable.innerHTML = "";
}

function tabulate(data, dataHeaders, outputElementId, overrideHeight) {

	var output = d3.select(outputElementId);

  var table = output.append("div")
										.attr("class", "selectorPanel")
										.style("width", "1000px")
										.style("height", (overrideHeight ? overrideHeight : "350px"))
										.style("max-height", (overrideHeight ? overrideHeight : "450px"))
										.append("table")
										.style("color", "#a6c1cb")
										.style("font-size", "18px");

	var tableHeader = table.append('thead');
	var tableBody = table.append('tbody');

	tableHeader.append('tr')
							.selectAll('th')
							.data(dataHeaders)
							.enter()
							.append('th')
							.text(function (d) {
								if (d === "datePosted")
									return "Date Posted";
								if (d === "hiringOrganization")
									return "Hiring Organization";
								if (d === "jobLocation")
									return "Job Location";
								if (d === "title")
									return "Title";
								if (d != "identifier")
									return d;
							});

	var rows = tableBody.selectAll('tr')
											.data(data)
											.enter()
											.append('tr');

	var cells = rows.selectAll('td')
	    						.data(function(row) {
										return dataHeaders.map(function(d) {
											return {
												column: d,
												value: row[d],
												url: row["identifier"]
											};
										});
									})
									.enter()
									.append('td')
									.text(function (d) {
										if (d.column === "identifier")
											return null;
										if (d.column === "datePosted")
											return formatDateby(d.value);
										else if (d.column === "description")
											return truncate(d.value, 500, "... more info ...");
										return d.value;
									})
//									.append("")
//									.text("more info ...")
//									.attr("xlink:href", function (d) {
//										if (d.column === "description")
//											return d.url;
//									})
									.style("padding", "15px")
									.style("vertical-align", "top");

	if (!overrideHeight) {
		output.append("p")
	//				.append("hr")
	//					.attr("align", "left")
	//					.attr("width", "25%")
	//				.append("br")
					.text("back up to ")
					.style("font-size", "16px")
					.append("a")
						.attr("href", "#plot")
						.text("plot")
					.style("font-size", "16px");
	}

  return output;
}

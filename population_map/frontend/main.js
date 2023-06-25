// Global variables
let states;
let statePops;
let totalPops;
let colorScale;
let selectedYear;
let yearData;
let highlightedColor = null;
let tooltip;

// Define the properties of the map container
let width = 800;
let height = 550;

function highlightStates(color) {
    d3.selectAll("path").style("opacity", 0.06);
    d3.selectAll("path")
        .filter(function () {
            return d3.select(this).style("fill") === color;
        })
        .style("opacity", 1);
}

function unhighlightStates() {
    d3.selectAll("path").style("opacity", 1).style("stroke", null);
}

function showTooltip(event, d) {
    let state = d.properties.name;
    if (!tooltip) {
        tooltip = d3
            .select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 1);
    }

    let stateData = statePops.filter(
        (entry) =>
            entry["State"] === state &&
            entry["Year"] == selectedYear &&
            entry["Sex"] === "Total Sex" &&
            entry["Age Group"] === "Total Age Group" &&
            entry["Ethnic group"] != "Total Ethnic Group"
    );

    let totalStatePopulation = stateData.reduce(
        (acc, curr) => acc + Number(curr["Value ('000 Person)"]),
        0
    );
    totalStatePopulation = Math.round(totalStatePopulation * 10) / 10;

    let tooltipHtml;
    if (stateData.length > 0) {
        tooltipHtml =
            "<strong>State:</strong> <span style='color:black'>" +
            state +
            "</span><br>" +
            "<strong>Total Population ('000):</strong> <span style='color:black'>" +
            totalStatePopulation +
            "</span><br>";

        stateData.forEach((entry) => {
            let percentage = entry["Percentage"];
            tooltipHtml += `<strong>${entry["Ethnic group"]}:</strong> ${percentage}%<br>`;
        });
    } else {
        tooltipHtml = `${state}: No data in year ${selectedYear}`;
    }

    tooltip.transition().style("opacity", 0.9);
    tooltip
        .html(tooltipHtml)
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 28 + "px");
}

function hideTooltip(event, d) {
    tooltip.transition().duration(500).style("opacity", 0);
}

function drawLegend() {
    let legendContainerHeight = 200;

    let legendContainer = d3
        .select("#map-container")
        .append("svg")
        .attr("width", 60)
        .attr("height", legendContainerHeight)
        .style("position", "absolute")
        .style("right", "0")
        .style("bottom", "0")
        .style("transform", "translateY(-50%)");

    let colorSteps = colorScale.range().length;
    let colorStepHeight = legendContainerHeight / colorSteps;

    colorScale.range().forEach((color, i) => {
        legendContainer
            .append("rect")
            .attr("width", 30)
            .attr("height", colorStepHeight)
            .attr("y", i * colorStepHeight)
            .style("fill", color)
            .style("cursor", "hand")
            .on("click", () => {
                // Check if the clicked color is already highlighted
                if (highlightedColor === color) {
                    unhighlightStates();
                    highlightedColor = null;
                } else {
                    highlightStates(color);
                    highlightedColor = color;
                }
            });
    });

    // Append labels to the legend container
    legendContainer
        .append("text")
        .attr("x", 35)
        .attr("y", 14)
        .text("Low")
        .attr("alignment-baseline", "middle")
        .style("font-size", "12px")
        .style("font-family", "sans-serif");

    legendContainer
        .append("text")
        .attr("x", 35)
        .attr("y", 189)
        .text("High")
        .attr("alignment-baseline", "middle")
        .style("font-size", "12px")
        .style("font-family", "sans-serif");
}

function drawPopulationText() {
    let selectedPopulationData = totalPops.find(
        (d) => +d["Year"] === selectedYear
    );
    d3.select("#population").html(
        `<strong>Total population in ${selectedYear}</strong>:</br>${selectedPopulationData["TotalPopulation"]}`
    );
}

function drawMap() {
    let center = d3.geoCentroid(states);
    let scale = 2800;
    let translate = [width / 2 + 100, height / 2];
    let geoProjection = d3
        .geoMercator()
        .center(center)
        .scale(scale)
        .translate(translate);
    let geoGenerator = d3.geoPath().projection(geoProjection);

    let mapContainer = d3
        .select("#map-container")
        .selectAll("svg.map")
        .data([states])
        .join("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    mapContainer
        .selectAll("path")
        .data(states.features)
        .join("path")
        .attr("d", geoGenerator)
        .style("cursor", "pointer")
        .attr("fill", function (d) {
            let matchedData = yearData.find(
                (entry) => entry["State"] === d.properties.name
            );
            return matchedData
                ? colorScale(matchedData["Value ('000 Person)"])
                : "#ccc";
        })
        .attr("stroke", "#000")
        .attr("stroke-width", "1.5")
        .on("mouseover", function (event, d) {
            // Skip unhighlight states
            if (
                highlightedColor &&
                d3.select(this).style("fill") !== highlightedColor
            ) {
                return;
            }

            d3.select(this).attr("fill", "#FF4B4B");

            showTooltip(event, d);
        })
        .on("mouseout", function (event, d) {
            d3.select(this).attr("fill", function () {
                let matchedData = yearData.find(
                    (entry) => entry["State"] === d.properties.name
                );
                if (matchedData) {
                    return colorScale(matchedData["Value ('000 Person)"]);
                } else {
                    return "#ccc";
                }
            });
            hideTooltip(event, d);
        })
        .on("click", function (event, d) {
            Streamlit.notifyHost({
                value: d.properties.name,
                dataType: "json",
            });
            window.rendered = true;
        });
}

function update(props) {
    selectedYear = parseInt(props.year);

    // Retrieve the population value for each state
    let populationData = statePops.filter(
        (d) =>
            d["Ethnic group"] === "Total Ethnic Group" &&
            d["Sex"] === "Total Sex" &&
            d["Age Group"] === "Total Age Group"
    );

    yearData = populationData.filter((d) => +d["Year"] === selectedYear);

    // Define a color scale for mapping population values to colors
    colorScale = d3
        .scaleQuantize()
        .domain([0, d3.max(yearData, (d) => +d["Value ('000 Person)"])])
        .range(d3.quantize((t) => d3.interpolateGreens(t * 0.8 + 0.1), 7));

    drawLegend();
    drawMap();
    drawPopulationText();
}

// Access values sent from Streamlit
function onRender(event) {
    let props = event.data.args;

    // load topojson
    d3.json("data/my-states.json").then((data) => {
        states = topojson.feature(data, data.objects.states);
    });

    // load data
    d3.csv("data/pop-total.csv").then((data) => {
        totalPops = data;
    });

    d3.csv("data/pop-states.csv").then((data) => {
        statePops = data;
        update(props);
    });
}

Streamlit.events.addEventListener(Streamlit.MSG_RENDER, onRender);
Streamlit.setComponentReady();
Streamlit.setFrameHeight(height);

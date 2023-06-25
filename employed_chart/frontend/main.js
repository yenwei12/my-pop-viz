// Global variables
let employedPop;
let selectedYear;
let tooltip;
let colorScale;
let svg;

// Define the properties of the  container
let width = 1000;
let height = 600;

// Code from https://observablehq.com/@jtrim-ons/svg-text-wrapping
function wrapText(
    text,
    width,
    dyAdjust,
    lineHeightEms,
    lineHeightSquishFactor,
    splitOnHyphen,
    centreVertically
) {
    // Use default values for the last three parameters if values are not provided.
    if (!lineHeightEms) lineHeightEms = 1.05;
    if (!lineHeightSquishFactor) lineHeightSquishFactor = 1;
    if (splitOnHyphen == null) splitOnHyphen = true;
    if (centreVertically == null) centreVertically = true;

    text.each(function () {
        var text = d3.select(this),
            x = text.attr("x"),
            y = text.attr("y");

        var words = [];
        text.text()
            .split(/\s+/)
            .forEach(function (w) {
                if (splitOnHyphen) {
                    var subWords = w.split("-");
                    for (var i = 0; i < subWords.length - 1; i++)
                        words.push(subWords[i] + "-");
                    words.push(subWords[subWords.length - 1] + " ");
                } else {
                    words.push(w + " ");
                }
            });

        text.text(null); // Empty the text element

        // `tspan` is the tspan element that is currently being added to
        var tspan = text.append("tspan");

        var line = ""; // The current value of the line
        var prevLine = ""; // The value of the line before the last word (or sub-word) was added
        var nWordsInLine = 0; // Number of words in the line
        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            prevLine = line;
            line = line + word;
            ++nWordsInLine;
            tspan.text(line.trim());
            if (
                tspan.node().getComputedTextLength() > width &&
                nWordsInLine > 1
            ) {
                // The tspan is too long, and it contains more than one word.
                // Remove the last word and add it to a new tspan.
                tspan.text(prevLine.trim());
                prevLine = "";
                line = word;
                nWordsInLine = 1;
                tspan = text.append("tspan").text(word.trim());
            }
        }

        var tspans = text.selectAll("tspan");

        var h = lineHeightEms;
        // Reduce the line height a bit if there are more than 2 lines.
        if (tspans.size() > 2)
            for (var i = 0; i < tspans.size(); i++) h *= lineHeightSquishFactor;

        tspans.each(function (d, i) {
            // Calculate the y offset (dy) for each tspan so that the vertical centre
            // of the tspans roughly aligns with the text element's y position.
            var dy = i * h + dyAdjust;
            if (centreVertically) dy -= ((tspans.size() - 1) * h) / 2;
            d3.select(this)
                .attr("y", y)
                .attr("x", 0)
                .attr("dy", dy + "em");
        });
    });
}

// What happens when a circle is dragged?
function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.03).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0.03);
    d.fx = null;
    d.fy = null;
}

function showTooltip(event, d) {
    if (!tooltip) {
        tooltip = d3
            .select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 1);
    }

    // let tooltipHtml = `${d.group}<br>${d.name}: ${d.value} ('000)`;
    let tooltipHtml =
        "<strong>Gender:</strong> <span style='color:black'>" +
        d.group +
        "</span><br>" +
        "<strong>Industry:</strong> <span style='color:black'>" +
        d.name +
        "</span><br>" +
        "<strong>Population ('000):</strong> <span style='color:black'>" +
        d.value +
        "</span>";

    tooltip.transition().duration(200).style("opacity", 0.9);
    tooltip
        .html(tooltipHtml)
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 28 + "px");
}

function hideTooltip(event, d) {
    tooltip.transition().duration(500).style("opacity", 0);
}

function drawBubbleChart() {
    if (!svg) {
        svg = d3
            .select("#chart-ctn")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
    }
    svg.selectAll("*").remove();

    let filteredData = employedPop.filter(
        (d) => d["Year"] === selectedYear && d["Sex"] !== "Total"
    );

    // A color scale
    colorScale = d3
        .scaleOrdinal()
        .domain(["Male", "Female"])
        // .range(["#4BA5FF", "#FF4B4B"]);
        .range(["#1f77b4", "#d62728"]);

    // Map the data to the required format for the visualization
    let mappedData = filteredData.map((d) => {
        // comparison
        let value = parseInt(d["Industry Employed Population ('000)"]);
        let counterpartValue = parseInt(
            filteredData.filter(
                (o) => o["Industry"] == d["Industry"] && o["Sex"] != d["Sex"]
            )[0]["value"]
        );
        return {
            name: d["Industry"],
            group: d.Sex,
            value: value,
            color:
                d.Sex.toLowerCase() == "Female" && value > counterpartValue
                    ? d3.color(colorScale(d.Sex)).darker(0.6)
                    : colorScale(d.Sex),
        };
    });

    // Filter the data for males and females separately
    let maleData = mappedData.filter((d) => d.group === "Male");
    let femaleData = mappedData.filter((d) => d.group === "Female");

    // Sort the male and female data in descending order based on value
    maleData.sort((a, b) => b.value - a.value);
    femaleData.sort((a, b) => b.value - a.value);

    // Take the top 5 values for males and females separately
    let top5MaleValues = maleData.slice(0, 5);
    let top5FemaleValues = femaleData.slice(0, 5);

    // A scale that gives an X target position for each group
    let x = d3.scaleOrdinal().domain(["Male", "Female"]).range([1400, 1800]);

    // A scale for the radius based on the value
    let radius = d3
        .scaleSqrt()
        .domain(d3.extent(mappedData, (d) => d.value))
        .range([10, 90]); // Adjust the range based on your desired size range

    // Initialize the circle: all located at the center of the SVG area
    let node = svg
        .append("g")
        .selectAll("g")
        .data(mappedData)
        .join("g")
        .attr("transform", (d) => `translate(${x(d.group)}, ${height / 2})`)
        .call(
            d3
                .drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
        )
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip);

    // Append circle to each group
    node.append("circle")
        .attr("r", (d) => radius(d.value))
        .style("fill", (d) => d.color)
        .style("fill-opacity", 0.8)
        .attr("stroke", "black")
        .style("stroke-width", 2);

    // Append text to each group displaying the age group
    node.append("text")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .style("font-size", "12px")
        .style("fill", "black")
        .text(function (d) {
            if (
                !(d.group === "Male" && top5MaleValues.includes(d)) &&
                !(d.group === "Female" && top5FemaleValues.includes(d))
            ) {
                return "";
            }

            return d.name;
        })
        .call(wrapText, 92, 0.5, 1.5, 1.5, true, true);

    // Features of the forces applied to the nodes:
    let simulation = d3
        .forceSimulation(mappedData)
        .force(
            "x",
            d3
                .forceX()
                .strength(0.4)
                .x((d) => x(d.group))
        )
        .force(
            "y",
            d3
                .forceY()
                .strength(0.4)
                .y(height / 2)
        )
        .force(
            "center",
            d3
                .forceCenter()
                .x(width / 2)
                .y(height / 2)
        )
        .force("charge", d3.forceManyBody().strength(1))
        .force(
            "collide",
            d3
                .forceCollide()
                .strength(0.6)
                .radius((d) => radius(d.value) + 3)
                .iterations(1)
        );

    // Apply these forces to the nodes and update their positions.
    // Once the force algorithm is happy with positions ('alpha' value is low enough), simulations will stop.
    simulation.on("tick", function () {
        node.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
    });

    // notify host once
    if (!window.rendered) {
        Streamlit.notifyHost({
            value: colorScale.range(),
            dataType: "json",
        });
        window.rendered = true;
    }
}

function update(props) {
    selectedYear = props.year.toString();
    drawBubbleChart();
}

// Access values sent from Streamlit
function onRender(event) {
    // load data
    d3.csv("data/pop-employment.csv").then((data) => {
        employedPop = data;
        update(event.data.args);
    });
}

Streamlit.events.addEventListener(Streamlit.MSG_RENDER, onRender);
Streamlit.setComponentReady();
Streamlit.setFrameHeight(height);

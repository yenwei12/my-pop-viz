// Global letiables
let stateBirthRates;
let selectedState;
let tooltip;

// Define the properties of the map container
let margin = {
    top: 50,
    right: 10,
    bottom: 60,
    left: 50,
};

let width = 240 - margin.left - margin.right;
let height = 250 - margin.top - margin.bottom;

function showTooltip(event, i, x, y, stateData) {
    if (!tooltip) {
        tooltip = d3
            .select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 1);
    }

    let xPos = d3.pointer(event)[0];
    let xDate = x.invert(xPos);

    let bisect = d3.bisector(function (d) {
        return new Date(d.Year, 0, 1);
    }).left;
    let index = bisect(stateData, xDate, 1);
    let d0 = stateData[index - 1];
    let d1 = stateData[index];
    let d =
        xDate - new Date(d0.Year, 0, 1) > new Date(d1.Year, 0, 1) - xDate
            ? d1
            : d0;

    let tooltipHtml =
        "<strong>Year:</strong> <span style='color:black'>" +
        d.Year +
        "</span><br>" +
        "<strong>Birth rate:</strong> <span style='color:black'>" +
        d3.format(".2f")(d.BirthRate) +
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

function draw() {
    stateBirthRates.sort((a, b) => d3.ascending(a.State, b.State));

    if (selectedState) {
        stateBirthRates = stateBirthRates.filter(
            (d) => d.State == selectedState
        );
        width = 900 - margin.left - margin.right;
        height = 400 - margin.top - margin.bottom;
        Streamlit.setFrameHeight(height + margin.top + margin.bottom);
    } else {
        width = 240 - margin.left - margin.right;
        height = 250 - margin.top - margin.bottom;
        Streamlit.setFrameHeight((height + margin.top + margin.bottom) * 3);
    }

    let nestedData = d3.group(stateBirthRates, (d) => d.State);

    // Clear the chart container
    d3.select("#chart-ctn").selectAll("*").remove();

    nestedData.forEach(function (stateData, state) {
        // Create a new chart for each state
        let svg = d3
            .select("#chart-ctn")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Set up scales and axes for the current state's chart
        let x = d3.scaleTime().range([0, width]);
        let y = d3.scaleLinear().range([height, 0]);

        x.domain([new Date("2001-01-01"), new Date("2020-12-31")]);
        y.domain([0, 100]);

        let xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("'%y"));
        let yAxis = d3.axisLeft(y);

        // Draw a line chart for the current state
        let path = svg.append("path")
            .datum(stateData)
            .attr("fill", "none")
            .attr("stroke", "#1f77b4")
            .attr("stroke-width", 2)
            .attr(
                "d",
                d3
                    .line()
                    .x((d) => x(new Date(d.Year, 0, 1)))
                    .y((d) => y(+d.BirthRate))
            );

        // Append x-axis and y-axis
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g").attr("class", "y-axis").call(yAxis);

        // Add a title for the current state's chart
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .text(state);

        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .style("opacity", 0)
            .on("mousemove", function (event, d) {
                showTooltip(event, d, x, y, stateData);
            })
            .on("mouseout", hideTooltip);

        if (selectedState) {
            // Append x-axis label
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height + margin.bottom - 20)
                .attr("text-anchor", "middle")
                .text("Year");

            // Append y-axis label
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -margin.left + 12)
                .attr("text-anchor", "middle")
                .text("Birth rate");
        }

        let totalLength = path.node().getTotalLength();

        path.attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(3000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
    });
}

function update(props) {
    // selectedYear = props.year.toString();
    if (!props.state) selectedState = null;
    else selectedState = props.state;

    draw();
    // drawBirthRateChart();
}

// Access values sent from Streamlit
function onRender(event) {
    // load data
    d3.csv("data/birthrate-states.csv").then((data) => {
        stateBirthRates = data.filter((d) => d.State != "Malaysia");
        update(event.data.args);
    });
}

Streamlit.events.addEventListener(Streamlit.MSG_RENDER, onRender);
Streamlit.setComponentReady();
Streamlit.setFrameHeight((height + margin.top + margin.bottom) * 3);

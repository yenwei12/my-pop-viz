// Global letiables
let lifeData;
let fertilityData;
let populationData;
let selectedYear;
let selectedState;
let tooltip;
let colorScale;
let highlightedState = null;
let svg;
let g;

// Define the properties of the map container
let margin = {
    top: 30,
    right: 50,
    bottom: 70,
    left: 70,
};

let width = 1000 - margin.left - margin.right;
let height = 550 - margin.top - margin.bottom;

function highlightStates(state) {
    d3.selectAll(".dot").style("opacity", function (d) {
        return d.state === state ? 1 : 0.1; // High opacity for selected state, low opacity for others
    });
}

// Function to reset the opacity when mouse is not over the legend
function unhighlightStates() {
    d3.selectAll(".dot").style("opacity", 1);
}

function highlightDots(event, d) {
    if (highlightedState === d) {
        // if the state is already highlighted, unhighlight it
        unhighlightStates();
        highlightedState = null;
        // g.selectAll(".dot")
        //     .on("mouseover", showTooltip)
        //     .on("mouseout", hideTooltip); // restore tooltip functionality
    } else {
        // if the state is not highlighted, highlight it
        highlightStates(d);
        highlightedState = d;
        // g.selectAll(".dot")
        //     .on("mouseover", function (d) {
        //         if (d.state === highlightedState) {
        //             showTooltip(d, this);
        //         }
        //     })
        //     .on("mouseout", hideTooltip);
    }
}

function showTooltip(event, d) {
    if (!tooltip) {
        tooltip = d3
            .select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 1);
    }

    let tooltipHtml =
        "<strong>State:</strong> <span style='color:black'>" +
        d.state +
        "</span><br>" +
        "<strong>Fertility Rate:</strong> <span style='color:black'>" +
        d.fertilityRate +
        "</span><br>" +
        "<strong>Life Expectancy:</strong> <span style='color:black'>" +
        d.lifeExpectancy +
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

function drawLegend() {
    svg.selectAll(".legend").remove();

    let legend = g
        .selectAll(".legend")
        .data(colorScale.domain())
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) {
            return "translate(0," + i * 25 + ")";
        })
        .on("click", highlightDots);

    legend
        .append("rect")
        .attr("x", width - 18)
        .attr("width", 25)
        .attr("height", 25)
        .attr("id", function (d) {
            return d.replace(/ /g, "_");
        })
        .style("fill", colorScale);

    legend
        .append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function (d) {
            return d;
        });
}

function drawScatterplot() {
    highlightedState = selectedState;

    if (!svg) {
        svg = d3
            .select("#chart-ctn")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
    }
    if (!g) {
        g = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    }
    g.selectAll("*").remove();

    let xValue = function (d) {
            return d.fertilityRate;
        },
        xScale = d3.scaleLinear().range([0, width]),
        xMap = function (d) {
            return xScale(xValue(d));
        },
        xAxis = d3.axisBottom(xScale);

    let yValue = function (d) {
            return d.lifeExpectancy;
        },
        yScale = d3.scaleLinear().range([height, 0]),
        yMap = function (d) {
            return yScale(yValue(d));
        },
        yAxis = d3.axisLeft(yScale);

    let cValue = function (d) {
            return d.state;
        },
        color = d3.scaleOrdinal(d3.schemeCategory10);

    let xExtent = d3.extent(fertilityData, (d) => +d["Fertility rate"]);
    let yExtent = d3.extent(lifeData, (d) => +d["Values"]);

    // Add axis label
    // Add axis label
    svg.append("text")
        .attr(
            "transform",
            "translate(" +
                (width / 2 + margin.left) +
                " ," +
                (height + margin.top + margin.bottom - 16) +
                ")"
        )
        .style("text-anchor", "middle")
        .text("Fertility Rate");

    // Add axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 + margin.left - 60)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Life Expectancy");

    let mergedData = lifeData
        .filter(function (row) {
            return row["Year"] == selectedYear;
        })
        .map(function (row) {
            let fertilityRow = fertilityData.find(function (fertilityRow) {
                return (
                    fertilityRow["Country or State"] === row["State"] &&
                    fertilityRow["Year"] == selectedYear
                );
            });
            let populationRow = populationData.find(function (populationRow) {
                return (
                    populationRow["State"] === row["State"] &&
                    populationRow["Year"] == selectedYear
                );
            });
            return {
                state: row["State"],
                year: +row["Year"],
                lifeExpectancy: +row["Values"],
                fertilityRate: fertilityRow
                    ? +fertilityRow["Fertility rate"]
                    : null,
                population: populationRow
                    ? +populationRow["Value ('000 Person)"]
                    : null,
            };
        })
        .filter(function (row) {
            return row["fertilityRate"] && row["population"];
        });

    let states = [...new Set(mergedData.map((d) => d.state))];

    colorScale = d3
        .scaleOrdinal()
        .domain(states)
        .range(
            [
                "#1f77b4",
                "#aec7e8",
                "#ff7f0e",
                "#ffbb78",
                "#2ca02c",
                "#98df8a",
                "#d62728",
                "#ff9896",
                "#9467bd",
                "#c5b0d5",
                "#8c564b",
                "#c49c94",
                "#e377c2",
                "#f7b6d2",
                "#7f7f7f",
                "#c7c7c7",
            ].slice(0, states.length)
        );

    xScale.domain([xExtent[0] - 1, xExtent[1] + 1]);
    yScale.domain([yExtent[0] - 1, yExtent[1] + 1]);

    // draw axis labels

    g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Fertility Rate");

    g.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Life Expectancy");

    g.selectAll(".dot")
        .data(mergedData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("r", function (d) {
            return Math.sqrt(d.population) / 2;
        })
        .attr("cx", xMap)
        .attr("cy", yMap)
        .style("fill", function (d) {
            return colorScale(cValue(d));
        })
        .style("opacity", 0.85)
        .on("click", function (event, d) {
            highlightDots(event, d.state);
        })
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip)
        .transition()
        .duration(3000)
        .attr("cx", function (d) {
            return xScale(xValue(d));
        })
        .attr("cy", function (d) {
            return yScale(yValue(d));
        });

    drawLegend();
}

function update(props) {
    selectedYear = props.year;
    if (!props.state) selectedState = null;
    else selectedState = props.state;

    drawScatterplot();
}

// Access values sent from Streamlit
function onRender(event) {
    // load data
    d3.csv("data/life-expectancy.csv").then((data) => {
        lifeData = data.filter(function (row) {
            return row["Gender"] === "Total";
        });
    });
    d3.csv("data/fertility-rate.csv").then((data) => {
        fertilityData = data.filter(function (row) {
            return (
                +row["Year"] >= 2012 &&
                +row["Year"] <= 2020 &&
                row["Age-specific Fertility Rate"] === "Total Fertility Rate"
            );
        });
    });
    d3.csv("data/states-pop.csv").then((data) => {
        populationData = data.filter(function (row) {
            return (
                row["Year"] >= 2012 &&
                row["Year"] <= 2020 &&
                row["Sex"] === "Total Sex" &&
                row["Age Group"] === "Total Age Group" &&
                row["Ethnic group"] === "Total Ethnic Group"
            );
        });
        update(event.data.args);
    });
}

Streamlit.events.addEventListener(Streamlit.MSG_RENDER, onRender);
Streamlit.setComponentReady();
Streamlit.setFrameHeight(height + margin.top + margin.bottom);

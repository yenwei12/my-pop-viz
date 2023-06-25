// Global variables
let stateDeaths;
let selectedYear;
let selectedState;
let tooltip;
let colorScale;

// Define the properties of the map container
let margin = {
    top: 90,
    right: 50,
    bottom: 60,
    left: 50,
};

let width = 1000 - margin.left - margin.right;
let height = 550 - margin.top - margin.bottom;

function showTooltip(event, d) {
    if (!tooltip) {
        tooltip = d3
            .select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 1);
    }

    let tooltipHtml = `Group: ${d.key}<br>Age Group: ${d.group}<br>Deaths: ${d.value}`;
    tooltip.transition().duration(200).style("opacity", 0.9);
    tooltip
        .html(tooltipHtml)
        .style(
            "left",
            d3.pointer(event, d3.select(".group-bar").node())[0] + 30 + "px"
        )
        .style(
            "top",
            d3.pointer(event, d3.select(".group-bar").node())[1] - 30 + "px"
        );
}

function hideTooltip(event, d) {
    tooltip.transition().duration(500).style("opacity", 0);
}

function drawDeathChart() {
    d3.select(".group-bar").selectAll("*").remove();
    let svg = d3
        .select(".group-bar")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    let infoTest = svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .attr("font-size", "24px")
        .attr("font-weight", "bold");
    if (
        selectedYear < 2001 ||
        selectedYear > 2018 ||
        (selectedYear < 2014 && selectedState === "Sabah")
    ) {
        infoTest.attr("fill", "red");
        if (!selectedState)
            infoTest.text(`No death rate data for year ${selectedYear}`);
        else
            infoTest.text(
                `No death rate data for ${selectedState} in ${selectedYear}`
            );
        return;
    }

    let array = [];
    let agegroup = [];
    let filteredData;

    // if no selected state shows all count for selected year
    if (!selectedState) {
        filteredData = stateDeaths;
    } else {
        filteredData = stateDeaths.filter((d) => d.State === selectedState);
    }

    let groups = d3.group(filteredData, (d) => d.Year);

    let death = d3.rollup(
        groups.get(selectedYear),
        (v) => d3.sum(v, (d) => +d.DeathCount),
        (d) => d.Sex,
        (d) => d.AgeGroup
    );

    let sexes = ["Male", "Female"];

    let maleAges = death.has("Male")
        ? Array.from(death.get("Male").keys())
        : [];

    let femaleAges = death.has("Female")
        ? Array.from(death.get("Female").keys())
        : [];

    let uniqueAges = [...new Set([...maleAges, ...femaleAges])];

    for (let age of uniqueAges) {
        let object = { group: age };

        for (let sex of sexes) {
            object[sex.toLowerCase()] =
                death.has(sex) && death.get(sex).has(age)
                    ? death.get(sex).get(age)
                    : 0;
        }

        array.push(object);
        agegroup.push(age);
    }

    let subgroups = sexes.map((d) => d.toLowerCase());

    let x = d3.scaleBand().domain(agegroup).range([0, width]).padding([0.2]);
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickSizeOuter(0));

    let maxCount = d3.max(
        array.map((obj) => {
            return Math.max(obj.male, obj.female);
        })
    );
    let y = d3.scaleLinear().domain([0, maxCount]).range([height, 0]);
    svg.append("g").call(d3.axisLeft(y));

    let xSubgroup = d3
        .scaleBand()
        .domain(subgroups)
        .range([0, x.bandwidth()])
        .padding([0.05]);

    colorScale = d3
        .scaleOrdinal()
        .domain(subgroups)
        .range(["#4BA5FF", "#FF4B4B"]);

    svg.append("g")
        .selectAll("g")
        .data(array)
        .join("g")
        .attr("transform", (d) => `translate(${x(d.group)}, 0)`)
        .selectAll("rect")
        .data((d) => {
            return subgroups.map((key) => ({
                key,
                value: d[key],
                group: d.group,
                color:
                    key.toLowerCase() == "female" && d.female > d.male
                        ? d3.color(colorScale(key)).darker(0.6)
                        : colorScale(key),
            }));
        })
        // include group
        .join("rect")
        .attr("x", (d) => xSubgroup(d.key))
        .attr("y", height)
        .attr("width", xSubgroup.bandwidth())
        .attr("height", 0)
        .attr("fill", (d) => d.color)
        .style("fill-opacity", 0.8)
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip)
        .transition()
        .duration(800)
        .delay((d, i) => i * 50)
        .attr("y", (d) => y(d.value))
        .attr("height", (d) => height - y(d.value));

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
    if (!props.state) selectedState = null;
    else selectedState = props.state;

    drawDeathChart();
}

// Access values sent from Streamlit
function onRender(event) {
    // load data
    d3.csv("data/death-states.csv").then((data) => {
        stateDeaths = data;
        update(event.data.args);
    });
}

Streamlit.events.addEventListener(Streamlit.MSG_RENDER, onRender);
Streamlit.setComponentReady();
Streamlit.setFrameHeight(height + margin.top + margin.bottom);

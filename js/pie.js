const width = 500;
const height = 500;
const radius = Math.min(width, height) / 2;

const svg = d3.select("#pie")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

const color = d3.scaleOrdinal()
    .domain(["Yes", "No", "Maybe"])
    .range(["#5cb85c", "#f0ad4e", "#5bc0de"]);

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

let rawData;

// Initialize the pie chart
d3.csv("final_data.csv").then(data => {
    rawData = data;

    // Get unique occupations and populate the dropdown
    const occupations = [...new Set(data.map(d => d.Occupation))];
    const dropdown = d3.select("#occupationSelect");

    // Clear existing options
    dropdown.selectAll("option").remove();
    
    // Add default option
    dropdown.append("option")
        .attr("value", "")
        .text("--Select Occupation--");

    // Add occupation options
    occupations.forEach(occ => {
        dropdown.append("option")
            .attr("value", occ)
            .text(occ);
    });

    // Add change event listener
    dropdown.on("change", function() {
        const selectedOccupation = this.value;
        if (selectedOccupation) {
            drawChart(selectedOccupation);
        } else {
            // Clear the chart if no occupation is selected
            svg.selectAll("*").remove();
        }
    });
});

function drawChart(selectedOccupation) {
    // Clear previous chart
    svg.selectAll("*").remove();

    const filtered = rawData.filter(d => d.Occupation === selectedOccupation);
    const counts = d3.rollups(filtered, v => v.length, d => d.Growing_Stress);

    const pie = d3.pie()
        .value(d => d[1]);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius - 10);

    const arcs = svg.selectAll("path")
        .data(pie(counts))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data[0]))
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 1);
            tooltip.html(`<strong>${d.data[0]}</strong><br>Count: ${d.data[1]}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add labels
    svg.selectAll("text")
        .data(pie(counts))
        .enter()
        .append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "white")
        .text(d => `${d.data[0]}: ${d.data[1]}`);

    // Add title
    svg.append("text")
        .attr("x", 0)
        .attr("y", -height/2 + 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`Growing Stress Distribution for ${selectedOccupation}`);
}

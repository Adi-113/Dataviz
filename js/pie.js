const width = 500;
const height = 500;
const radius = Math.min(width, height) / 2;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

const color = d3.scaleOrdinal()
    .domain(["Yes", "No", "Maybe"])
    .range(["#5cb85c", "#f0ad4e", "#5bc0de"]);

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");

let rawData;

d3.csv("final_data.csv").then(data => {
    rawData = data;

    const occupations = [...new Set(data.map(d => d.Occupation))];
    const dropdown = d3.select("#occupation");

    occupations.forEach(occ => {
        dropdown.append("option")
            .attr("value", occ)
            .text(occ);
    });

    dropdown.on("change", () => drawChart(dropdown.property("value")));
    drawChart(occupations[0]);
});

function drawChart(selectedOccupation) {
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
            tooltip.style("opacity", 1)
                .html(`<strong>${d.data[0]}</strong><br>Count: ${d.data[1]}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        });

    // Labels
    svg.selectAll("text")
        .data(pie(counts))
        .enter()
        .append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "white")
        .text(d => d.data[0]);
}

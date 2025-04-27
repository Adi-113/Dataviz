const selectMenu = document.getElementById('mentalHealthSelect');
selectMenu.addEventListener('change', function () {
    const value = this.value;
    if (value) visualize(value);
});

function visualize(selection) {
    d3.select("#bar").html("");

    const margin = { top: 60, right: 30, bottom: 50, left: 60 },
        width = 750 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom;

    const svg = d3.select("#bar")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip");

    d3.csv("final_data.csv").then(data => {
        const filteredData = data.filter(d => d.Mental_Health_History === selection);

        const categories = ["Coping_Struggles", "Work_Interest", "Social_Weakness"];

        const dataset = categories.map(cat => ({
            category: cat,
            Yes: filteredData.filter(d => d[cat] === "Yes").length,
            No: filteredData.filter(d => d[cat] === "No").length
        }));

        const subgroups = ["Yes", "No"];
        const colors = d3.scaleOrdinal().domain(subgroups).range(["#ff8a65", "#4dd0e1"]);

        const x0 = d3.scaleBand()
            .domain(categories)
            .range([0, width])
            .paddingInner(0.1);

        const x1 = d3.scaleBand()
            .domain(subgroups)
            .range([0, x0.bandwidth()])
            .padding(0.05);

        const y = d3.scaleLinear()
            .domain([0, d3.max(dataset, d => Math.max(d.Yes, d.No)) * 1.2])
            .nice()
            .range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x0));

        svg.append("g")
            .call(d3.axisLeft(y));

        const bars = svg.selectAll(".bars")
            .data(dataset)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${x0(d.category)},0)`);

        bars.selectAll("rect")
            .data(d => subgroups.map(key => ({ key, value: d[key] })))
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x1(d.key))
            .attr("y", height)
            .attr("width", x1.bandwidth())
            .attr("height", 0)
            .attr("fill", d => colors(d.key))
            .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1)
                    .html(`${d.key}: ${d.value}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 30) + "px");
            })
            .on("mousemove", (event) => {
                tooltip.style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 30) + "px");
            })
            .on("mouseout", () => tooltip.style("opacity", 0))
            .transition()
            .duration(800)
            .attr("y", d => y(d.value))
            .attr("height", d => height - y(d.value));

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -25)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .text(`Mental Health History: ${selection}`);

        const legend = svg.selectAll(".legend")
            .data(subgroups)
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(0,${i * 25})`);

        legend.append("rect")
            .attr("x", width - 20)
            .attr("y", -40)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", colors);

        legend.append("text")
            .attr("x", width - 26)
            .attr("y", -31)
            .attr("text-anchor", "end")
            .style("font-size", "14px")
            .text(d => d);
    });
}

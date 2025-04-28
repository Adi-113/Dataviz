const selectMenu = document.getElementById("mentalHealthSelect");
document.addEventListener("DOMContentLoaded", visualize(selectMenu.value));
selectMenu.addEventListener("change", function () {
  const value = this.value;
  if (value) visualize(value);
});

function visualize(selection) {
  d3.select("#bar").html("");

  const margin = { top: 40, right: 60, bottom: 60, left: 160 },
    width = 900 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  const svg = d3
    .select("#bar")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Add X-axis label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 20)
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Number of Responses");

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("background-color", "white")
    .style("padding", "10px")
    .style("border", "1px solid #ddd")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("font-size", "14px")
    .style("box-shadow", "2px 2px 6px rgba(0,0,0,0.1)");

  d3.csv("final_data.csv").then((data) => {
    const filteredData = data.filter(
      (d) => d.Mental_Health_History === selection
    );

    const categories = ["Coping_Struggles", "Work_Interest", "Social_Weakness"];
    
    // Format category labels
    const formatCategory = (cat) => {
      return cat.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const dataset = categories.map((cat) => ({
      category: formatCategory(cat),
      Yes: filteredData.filter((d) => d[cat] === "Yes").length,
      No: filteredData.filter((d) => d[cat] === "No").length,
    }));

    const subgroups = ["Yes", "No"];
    const colors = d3
      .scaleOrdinal()
      .domain(subgroups)
      .range(["#ff8a65", "#4dd0e1"]);

    // Y-axis for categories
    const y0 = d3
      .scaleBand()
      .domain(dataset.map(d => d.category))
      .range([0, height])
      .paddingInner(0.3);

    // Y-axis for Yes/No groups
    const y1 = d3
      .scaleBand()
      .domain(subgroups)
      .range([0, y0.bandwidth()])
      .padding(0.1);

    // X-axis for values
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(dataset, (d) => Math.max(d.Yes, d.No)) * 1.1])
      .nice()
      .range([0, width]);

    // Add and style Y axis
    svg
      .append("g")
      .call(d3.axisLeft(y0))
      .selectAll("text")
      .style("font-size", "13px")
      .style("font-weight", "bold");

    // Add and style X axis with gridlines
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(10))
      .selectAll("text")
      .style("font-size", "12px");

    // Add gridlines
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisBottom(x)
        .ticks(10)
        .tickSize(height)
        .tickFormat("")
      )
      .style("stroke-dasharray", "3,3")
      .style("stroke-opacity", 0.2);

    // Create bar groups
    const bars = svg
      .selectAll(".bars")
      .data(dataset)
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(0,${y0(d.category)})`);

    // Add bars
    bars
      .selectAll("rect")
      .data((d) => subgroups.map((key) => ({ key, value: d[key], category: d.category })))
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", (d) => y1(d.key))
      .attr("x", 0)
      .attr("height", y1.bandwidth())
      .attr("width", 0)
      .attr("fill", (d) => colors(d.key))
      .on("mouseover", (event, d) => {
        // Highlight the hovered bar
        d3.select(event.currentTarget)
          .style("opacity", 1)
          .style("stroke", "#333")
          .style("stroke-width", 2);

        tooltip
          .style("opacity", 1)
          .html(`
            <div style="font-weight: bold; margin-bottom: 5px">${d.category}</div>
            <div style="color: ${colors(d.key)}">${d.key}: ${d.value}</div>
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", (event) => {
        // Reset the bar style
        d3.select(event.currentTarget)
          .style("opacity", 0.8)
          .style("stroke", "none");

        tooltip.style("opacity", 0);
      })
      .style("opacity", 0.8)
      .transition()
      .duration(800)
      .attr("width", (d) => x(d.value));



    // Add title with better positioning
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top/2)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text(`Mental Health History: ${selection}`);

    // Adjust legend position and style
    const legend = svg
      .selectAll(".legend")
      .data(subgroups)
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(${width / 2 - 40 + i * 80},${height + 45})`);

    legend
      .append("rect")
      .attr("width", 16)
      .attr("height", 16)
      .style("fill", colors)
      .style("opacity", 0.8);

    legend
      .append("text")
      .attr("x", 22)
      .attr("y", 8)
      .attr("dy", ".35em")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(d => d);
  });
}

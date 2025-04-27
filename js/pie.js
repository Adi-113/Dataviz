const stressTypes = ["Yes", "No", "Maybe"];
const colors = { "Yes": "orange", "No": "darkblue", "Maybe": "cornflowerblue" };

const svg = d3.select("#pie"),
      margin = {top: 60, right: 60, bottom: 60, left: 60},
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom,
      radius = Math.min(width, height) / 2,
      chart = svg.append("g").attr("transform", `translate(${width / 2 + margin.left / 2},${height / 2 + margin.top / 2})`);

d3.csv("final_data.csv").then(fullData => {
  const occupations = Array.from(new Set(fullData.map(d => d.Occupation).filter(Boolean)));
  const select = d3.select("#occupationSelect");

  select.selectAll("option")
    .data(occupations)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  select.on("change", () => updateChart(select.node().value));
  updateChart(occupations[0]);

  function updateChart(selectedOccupation) {
    const filtered = fullData.filter(d => d.Occupation === selectedOccupation);

    const counts = stressTypes.map(stress => ({
      stress,
      value: filtered.filter(d => d.Growing_Stress === stress).length
    }));

    const pie = d3.pie()
      .sort(null)
      .value(d => d.value);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    chart.selectAll("*").remove();

    chart.selectAll('path')
      .data(pie(counts))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => colors[d.data.stress])
      .attr("stroke", "white")
      .style("stroke-width", "2px");

    // Add labels
    chart.selectAll('text')
      .data(pie(counts))
      .enter()
      .append('text')
      .text(d => d.data.value > 0 ? `${d.data.stress}: ${((d.data.value / d3.sum(counts, d => d.value)) * 100).toFixed(1)}%` : "")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .style("text-anchor", "middle")
      .style("font-size", "14px");

    // Title
    svg.selectAll(".title").remove();
    svg.append("text")
      .attr("class", "title")
      .attr("x", (width + margin.left + margin.right) / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .text(`Stress Distribution for Occupation: ${selectedOccupation}`);
    
    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width + margin.left - 50},${margin.top + 20})`);

    stressTypes.forEach((stress, i) => {
      const g = legend.append("g").attr("transform", `translate(0,${i * 25})`);
      g.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", colors[stress]);
      g.append("text")
        .attr("x", 25)
        .attr("y", 14)
        .text(stress)
        .style("font-size", "14px");
    });
  }
});
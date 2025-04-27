(() => {
    const width = 250;
    const height = 250;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select("#pie"),
        margin = { top: 60, right: 40, bottom: 60, left: 60 },
        chartWidth = +svg.attr("width") - margin.left - margin.right,
        chartHeight = +svg.attr("height") - margin.top - margin.bottom;

    const chart = svg.append("g")
        .attr("transform", `translate(${chartWidth / 2 + margin.left},${chartHeight / 2 + margin.top})`);

    const colors = {
        "Yes": "#4CAF50",
        "No": "#FF5252",
        "Maybe": "#2196F3"
    };

    // Enhanced tooltip with more details
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("color", "#333")
        .style("padding", "10px")
        .style("border-radius", "4px")
        .style("font-size", "14px")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)")
        .style("pointer-events", "none")
        .style("border", "1px solid #ddd");

    let rawData;
    let currentOccupation = "";
    let currentDaysIndoors = "";

    // Initialize the pie chart
    d3.csv("final_data.csv").then(data => {
        rawData = data;

        // Get unique occupations and populate the dropdown
        const occupations = [...new Set(data.map(d => d.Occupation))];
        const daysIndoorsValues = [...new Set(data.map(d => d.Days_Indoors))].sort((a, b) => a - b);

        // Setup occupation dropdown
        const occupationDropdown = d3.select("#occupationSelect");
        occupationDropdown.selectAll("option").remove();
        
        // Add occupation options and select first one by default
        occupations.forEach((occ, index) => {
            occupationDropdown.append("option")
                .attr("value", occ)
                .text(occ)
                .property("selected", index === 0); // Select first occupation by default
        });

        // Set initial occupation
        currentOccupation = occupations[0];

        // Setup days indoors dropdown
        const daysIndoorsDropdown = d3.select("#daysIndoorsSelect");
        daysIndoorsDropdown.selectAll("option").remove();
        daysIndoorsValues.forEach(days => {
            daysIndoorsDropdown.append("option")
                .attr("value", days)
                .text(`${days}`);
        });

        // Add change event listeners
        occupationDropdown.on("change", function() {
            currentOccupation = this.value;
            updateChart();
        });

        daysIndoorsDropdown.on("change", function() {
            currentDaysIndoors = this.value;
            updateChart();
        });

        // Initial chart render
        updateChart();
    });

    function updateChart() {
        // Filter data based on both selections
        let filtered = rawData;
        
        if (currentOccupation) {
            filtered = filtered.filter(d => d.Occupation === currentOccupation);
        }
        
        if (currentDaysIndoors) {
            filtered = filtered.filter(d => d.Days_Indoors === currentDaysIndoors);
        }

        const counts = d3.rollups(filtered, v => v.length, d => d.Growing_Stress);
        
        // Clear previous chart
        chart.selectAll("*").remove();

        const pie = d3.pie()
            .value(d => d[1])
            .sort(null);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius - 10);

        // Draw pie slices
        const arcs = chart.selectAll("path")
            .data(pie(counts))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => colors[d.data[0]])
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .style("opacity", 0.8)
            .on("mouseover", function(event, d) {
                // Dim all arcs
                arcs.style("opacity", 0.3);
                // Highlight selected arc
                d3.select(this)
                    .style("opacity", 1)
                    .attr("d", d3.arc()
                        .innerRadius(0)
                        .outerRadius(radius - 5));
                
                // Show detailed tooltip
                const total = d3.sum(counts, d => d[1]);
                const percentage = ((d.data[1] / total) * 100).toFixed(1);
                const category = d.data[0];
                const count = d.data[1];
                
                tooltip.style("opacity", 1)
                    .html(`
                        <div style="font-weight: bold; margin-bottom: 5px; color: ${colors[category]}">${category}</div>
                        <div style="font-size: 16px; font-weight: bold">${percentage}%</div>
                        <div style="font-size: 12px; color: #666">of total responses</div>
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                // Reset all arcs
                arcs.style("opacity", 0.8)
                    .attr("d", arc);
                // Hide tooltip
                tooltip.style("opacity", 0);
            });


        // Add legend
        const legendGroup = svg.selectAll(".legend")
            .data(Object.entries(colors))
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(${chartWidth / 2 - 50 + i * 100},${chartHeight + margin.top + 70})`);

        legendGroup.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", d => d[1]);

        legendGroup.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(d => d[0]);
    }
})();
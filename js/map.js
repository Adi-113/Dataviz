const width = 960;
const height = 600;

const svg = d3.select('#map').attr('width', width).attr('height', height);

const projection = d3
  .geoMercator()
  .scale(140)
  .translate([width / 2, height / 1.5]);

const geoPath = d3.geoPath().projection(projection);
const tooltip = d3.select('#tooltip');

Promise.all([
  d3.json(
    'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'
  ),
  d3.csv('final_data.csv'),
]).then(([mapData, surveyData]) => {
  // Initialize the occupation selector
  occupationSelect.init(surveyData);

  // Set up the change handler
  occupationSelect.onOccupationChange(updateMap);

  // Initial map update
  updateMap(occupationSelect.getSelectedOccupation());

  function updateMap(selectedOccupation) {
    const filteredData = surveyData.filter(
      (d) => d.Occupation === selectedOccupation
    );

    const countryStats = d3.rollup(
      filteredData,
      (entries) => ({
        totalResponses: entries.length,
        stressedCount: entries.filter((d) => d.Growing_Stress === 'Yes').length,
      }),
      (d) => d.Country
    );

    const stressLevels = new Map();
    const responseCounts = new Map();

    for (const [country, stats] of countryStats.entries()) {
      const { totalResponses, stressedCount } = stats;
      stressLevels.set(country, (stressedCount / totalResponses) * 100);
      responseCounts.set(country, totalResponses);
    }

    // Updated Gradient
    const colorScale = d3
      .scaleLinear()
      .domain([20, 30, 40])
      .range(['#00FF00', '#FFFF00', '#FF0000']);

    svg.selectAll('path').remove();

    svg
      .append('g')
      .selectAll('path')
      .data(mapData.features)
      .enter()
      .append('path')
      .attr('d', geoPath)
      .attr('fill', (d) => {
        const stress = stressLevels.get(d.properties.name);
        return stress != null ? colorScale(stress) : '#d3d3d3';
      })
      .style('stroke', '#fff')
      .style('stroke-width', 0.5)
      .on('mouseover', function (event, d) {
        d3.select(this).style('stroke', '#000').style('stroke-width', 1.5);

        const country = d.properties.name;
        const stress = stressLevels.get(country);

        tooltip
          .style('opacity', 1)
          .html(
            `
            <strong>${country}</strong><br>
            Stress Level: ${
              stress != null ? stress.toFixed(1) + '%' : 'No data'
            }<br>
          `
          )
          .style('left', event.pageX + 15 + 'px')
          .style('top', event.pageY - 40 + 'px');
      })
      .on('mousemove', function (event) {
        tooltip
          .style('left', event.pageX + 15 + 'px')
          .style('top', event.pageY - 40 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).style('stroke', '#fff').style('stroke-width', 0.5);
        tooltip.style('opacity', 0);
      });
  }
});

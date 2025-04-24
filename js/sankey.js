d3.csv('final_data.csv').then((data) => {
  const margin = { top: 10, right: 10, bottom: 10, left: 10 };
  const width = 960 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select('body').append('div').attr('class', 'tooltip');

  const sankey = d3
    .sankey()
    .nodeWidth(36)
    .nodePadding(40)
    .size([width, height]);

  updateSankeyDiagram(data);

  function updateSankeyDiagram(data) {
    svg.selectAll('*').remove();
    const totalCount = data.length;

    const processedData = processData(data);
    const graph = sankey(processedData);
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const link = svg
      .append('g')
      .selectAll('.link')
      .data(graph.links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.sankeyLinkHorizontal())
      .attr('stroke-width', (d) => Math.max(1, d.width))
      .style('stroke', (d) => color(d.source.name))
      .style('fill', 'none')
      .style('stroke-opacity', 0.5)
      .on('mouseover', function (event, d) {
        const percent = ((d.value / totalCount) * 100).toFixed(1);
        link.style('stroke-opacity', (l) => (l === d ? 0.8 : 0.05));
        node
          .select('rect')
          .style('opacity', (n) =>
            n === d.source || n === d.target ? 1 : 0.1
          );

        tooltip.transition().duration(200).style('opacity', 1);
        tooltip
          .html(
            d.fullPath
              ? `<div><strong>Family History:</strong> ${d.fullPath.family_history}</div>
                   <div><strong>Treatment:</strong> ${d.fullPath.treatment}</div>
                   <div><strong>Care Options:</strong> ${d.fullPath.care_options}</div>
                   <div><strong>Population:</strong> ${percent}%</div>`
              : `<div><strong>${d.source.name}</strong> → <strong>${d.target.name}</strong><br>Population: ${percent}%</div>`
          )
          .style('left', event.pageX + 15 + 'px')
          .style('top', event.pageY - 30 + 'px');
      })
      .on('mouseout', function () {
        link.style('stroke-opacity', 0.5);
        node.select('rect').style('opacity', 1);
        tooltip.transition().duration(300).style('opacity', 0);
      });

    const node = svg
      .append('g')
      .selectAll('.node')
      .data(graph.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`)
      .call(
        d3
          .drag()
          .subject((d) => d)
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    node
      .append('rect')
      .attr('height', (d) => d.y1 - d.y0)
      .attr('width', sankey.nodeWidth())
      .style('fill', (d) => color(d.name))
      .style('stroke', (d) => d3.rgb(color(d.name)).darker(2))
      .on('mouseover', function (event, d) {
        const related = new Set();
        link.each((l) => {
          if (l.source === d || l.target === d) related.add(l);
        });

        link.style('stroke-opacity', (l) => (related.has(l) ? 0.8 : 0.05));
        node
          .select('rect')
          .style('opacity', (n) =>
            n === d ||
            [...related].some((l) => l.source === n || l.target === n)
              ? 1
              : 0.1
          );

        const nodePercent = ((d.value / totalCount) * 100).toFixed(1);
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip
          .html(`<strong>${d.name}</strong><br>Flow: ${nodePercent}%`)
          .style('left', event.pageX + 15 + 'px')
          .style('top', event.pageY - 30 + 'px');
      })
      .on('mouseout', function () {
        link.style('stroke-opacity', 0.5);
        node.select('rect').style('opacity', 1);
        tooltip.transition().duration(300).style('opacity', 0);
      });

    node
      .append('text')
      .attr('x', (d) => (d.x0 < width / 2 ? sankey.nodeWidth() + 6 : -6))
      .attr('y', (d) => (d.y1 - d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d) => (d.x0 < width / 2 ? 'start' : 'end'))
      .text((d) => d.name)
      .style('font-size', '10px')
      .style('font-family', 'Arial');

    function dragstarted(event, d) {
      d3.select(this).raise().classed('active', true);
    }

    function dragged(event, d) {
      d3.select(this).attr(
        'transform',
        `translate(${(d.x0 = Math.max(
          0,
          Math.min(width - sankey.nodeWidth(), event.x)
        ))},${(d.y0 = Math.max(0, Math.min(height - (d.y1 - d.y0), event.y)))})`
      );
      sankey.update(graph);
      link.attr('d', d3.sankeyLinkHorizontal());
    }

    function dragended(event, d) {
      d3.select(this).classed('active', false);
    }
  }

  function processData(data) {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    data.forEach((d) => {
      ['family_history', 'treatment', 'care_options'].forEach((col) => {
        const name = `${col}: ${d[col]}`;
        if (!nodeMap.has(name)) {
          nodeMap.set(name, { name, index: nodes.length });
          nodes.push({ name });
        }
      });
    });

    const linkMap = new Map();
    data.forEach((d) => {
      const fh = d.family_history;
      const tr = d.treatment;
      const co = d.care_options;

      const key1 = `family_history: ${fh}|treatment: ${tr}`;
      const key2 = `family_history: ${fh}|treatment: ${tr}|care_options: ${co}`;

      linkMap.set(key1, (linkMap.get(key1) || 0) + 1);
      linkMap.set(key2, (linkMap.get(key2) || 0) + 1);
    });

    for (const [key, value] of linkMap.entries()) {
      const parts = key.split('|');
      if (parts.length === 2) {
        const [source, target] = parts;
        links.push({
          source: nodeMap.get(source).index,
          target: nodeMap.get(target).index,
          value: value,
        });
      } else if (parts.length === 3) {
        const [fh, tr, co] = parts;
        links.push({
          source: nodeMap.get(tr).index,
          target: nodeMap.get(co).index,
          value: value,
          fullPath: {
            family_history: fh.split(': ')[1],
            treatment: tr.split(': ')[1],
            care_options: co.split(': ')[1],
          },
        });
      }
    }

    return { nodes, links };
  }
});

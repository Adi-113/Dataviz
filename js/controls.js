// Global occupation selection controls
const occupationSelect = {
  init: function (surveyData) {
    const occupations = Array.from(
      new Set(surveyData.map((d) => d.Occupation).filter(Boolean))
    ).sort();
    const dropdown = d3.select("#occupationSelect");

    dropdown
      .selectAll("option")
      .data(occupations)
      .enter()
      .append("option")
      .attr("value", (d) => d)
      .text((d) => d);

    return dropdown;
  },

  getSelectedOccupation: function () {
    return d3.select("#occupationSelect").node().value;
  },

  onOccupationChange: function (callback) {
    d3.select("#occupationSelect").on("change", function () {
      callback(this.value);
    });
  },
};

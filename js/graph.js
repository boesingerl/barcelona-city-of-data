class HistGraph {

  constructor(datapath, graphId, {districtFeature = 'District.Name', yearFeature = 'Year', mainFeature = 'Number', color="#69b3a2", width_ = 300, height_ = 300, margin = {
    top: 30,
    right: 30,
    bottom: 70,
    left: 60
  }}={}) {

    this.margin  = margin
    this.graphId = graphId
    this.rectId  = graphId + "rects"
    this.color = color
    this.width   = width_ - margin.left - margin.right
    this.height  = height_ - margin.top - margin.bottom;
    this.dataset = d3.csv(datapath)

    this.currentData = null

    this.districtFeature = districtFeature
    this.yearFeature     = yearFeature
    this.mainFeature     = mainFeature

    this.dataset.then(data => this.aggData(data))
                .then(([districtD, totalD]) => {
                  this.perDistrictData = districtD
                  this.totalData = totalD
                  this.createGraph(totalD)
                  this.currentData = totalD
                })

  }

  aggData(data) {

    let per_district_pop = _(data)
      .groupBy(i => [i[this.yearFeature], i[this.districtFeature]])
      .map((d, id) => ({
        year: id.split(',')[0],
        name: id.split(',')[1],
        total: _.sumBy(d, i => Number(i[this.mainFeature]))
      })).value()

    let total_pop = _(per_district_pop).groupBy('year').map((d, id) => ({
      year: id,
      total: _.sumBy(d, 'total')
    })).value()


    return [per_district_pop, total_pop]
  }


  createGraph(totalData) {

    // append the svg object to the body of the page
    let svg = d3.select("#" + this.graphId)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")");


    // X axis
    let x = d3.scaleBand()
      .range([0, this.width])
      .domain(totalData.map(function(d) {
        return d.year;
      }).sort())
      .padding(0.2);

    // Add X axis
    svg.append("g").attr("class", "axisx")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    // Y axis
    let y = d3.scaleLinear()
      .domain([0.95 * d3.min(totalData.map((d) => d.total)), d3.max(totalData.map((d) => d.total))])
      .range([this.height, 0]);

    // Add Y axis
    svg.append("g").attr("class", "axisy")
      .call(d3.axisLeft(y));


    // Bars
    svg.append('g').attr("id", this.rectId).selectAll("mybar")
      .data(totalData)
      .enter()
      .append("rect")
      .attr("x", function(d) {
        return x(d.year);
      })
      .attr("y", function(d) {
        return y(d.total);
      })
      .attr("width", x.bandwidth())
      .attr("height", (d) => {
        return this.height  - y(d.total);
      })
      .attr("fill", this.color)
  }

  updateYAxis(startingFromZero, transitionDuration = 700){

    let y = null

    if(startingFromZero){
      y = d3.scaleLinear()
      .domain([0, d3.max(this.currentData.map((d) => d.total))])
      .range([this.height, 0]);
    }else{
      y = d3.scaleLinear()
      .domain([0.95 * d3.min(this.currentData.map((d) => d.total)), d3.max(this.currentData.map((d) => d.total))])
      .range([this.height, 0]);
    }

    d3.select("#" + this.graphId).select(".axisy").transition().duration(transitionDuration).call(d3.axisLeft(y))

    let rects = d3.select('#' + this.rectId).selectAll("rect")
      .data(this.currentData)

    rects.enter()
      .append('rect')

    rects.transition()
      .duration(transitionDuration)
      .attr("y", function(d) {
        return y(d.total);
      })
      .attr("height", (d) => {
        return this.height - y(d.total);
      })

    rects.exit().remove()

  }

  update(district, callBack = () => {}, transitionDuration = 500) {

    let filtered_dat = _.filter(this.perDistrictData, (d) => d.name == district)

    this.currentData = filtered_dat

    let x = d3.scaleBand()
      .range([0, this.width])
      .domain(filtered_dat.map(function(d) {
        return d.year;
      }).sort())
      .padding(0.2);

    let y = d3.scaleLinear()
      .domain([0.95 * d3.min(filtered_dat.map((d) => d.total)), d3.max(filtered_dat.map((d) => d.total))])
      .range([this.height, 0]);

    d3.select("#" + this.graphId).select(".axisx").transition().duration(transitionDuration).call(d3.axisBottom(x)).on('end', callBack)
    d3.select("#" + this.graphId).select(".axisy").transition().duration(transitionDuration).call(d3.axisLeft(y))

    let rects = d3.select('#' + this.rectId).selectAll("rect")
      .data(filtered_dat)

    rects.enter()
      .append('rect')

    rects.transition()
      .duration(transitionDuration)
      .attr("y", function(d) {
        return y(d.total);
      })
      .attr("height", (d) => {
        return this.height - y(d.total);
      })

    rects.exit().remove()
  }
}

'use strict';

/*
This class is probably the most complicated of them all
It needs to be able to use many kinds of different data formats

It also needs to handle three types of bar graphs based on the selected districts :
- Showing the overall summed dataset
- Showing the dataset for a single district
- Showing grouped bars for two selected districts

This seperation into 3 makes it very hard to write modular code,
as we need to always check in which situation we are,
and to update all bars in the svg accordingly
*/
class HistGraph {

  /*
  Constructor allows to select features from csv file such as district, x and main (y axis) Feature
  It allows to select the size of font for x and y axis texts
  It also allows to select a color, which would then be used for the whole graph if either none or a single district is selected (otherwise reverts to blue, red)
  It allows to filter the csv data by selecting a single year, a single month, or both, (in this case, uses the csv feature 'Year' and 'Month' to do so)
  */
  constructor(datapath, graphId, {
    districtFeature = 'District.Name',
    xFeature = 'Year',
    mainFeature = 'Number',
    xAxisPx = "20px",
    xAxisTrans = "translate(-10,0)rotate(-45)",
    yAxisPx = "16px",
    color = "#69b3a2",
    filterYear = null,
    filterMonth = null,
    width_ = 300,
    height_ = 300,
    margin = {
      top: 10,
      right: 30,
      bottom: 70,
      left: 80
    }
  } = {}) {

    /*
    We simply set all class arguments
    */
    this.margin = margin
    this.graphId = graphId
    this.rectId = graphId + "rects"
    this.color = color
    this.width = width_ - margin.left - margin.right
    this.height = height_ - margin.top - margin.bottom;
    this.dataset = d3.csv(datapath)

    this.currentData = null

    this.districtFeature = districtFeature
    this.xFeature = xFeature
    this.mainFeature = mainFeature

    this.filterYear = filterYear
    this.filterMonth = filterMonth

    this.xAxisPx = xAxisPx
    this.xAxisTrans = xAxisTrans
    this.yAxisPx = yAxisPx

    /**
      Compute the datasets
      Compute both total, and perDistrict data, for overall and per district views
    */
    this.dataset.then(data => this.aggData(data))
      .then(([districtD, totalD]) => {
        this.perDistrictData = districtD
        this.totalData = totalD
        this.createGraph(totalD)
        this.currentData = totalD
      })

  }

  async aggData(data) {

    /* Apply the first filter on month and year if they are defined*/
    if (this.filterYear) {
      data = _(data).filter(d => d.Year == this.filterYear).value()
    }
    if (this.filterMonth) {
      data = _(data).filter(d => d.Month == this.filterMonth).value()
    }

    /*
    Compute the per district dataset
    We have to group both by the x feature and by the district in this case
    */
    let per_district_pop = _(data)
      .groupBy(i => [i[this.xFeature], i[this.districtFeature]])
      .map((d, id) => ({
        xFeature: id.split(',')[0],
        name: id.split(',')[1],
        total: _.sumBy(d, i => Number(i[this.mainFeature]))
      })).value()

      /*
      Compute the total dataset
      Here, we only group by the x feature and compute the sum
      */
    let total_pop = _(per_district_pop).groupBy('xFeature').map((d, id) => ({
      xFeature: id,
      total: _.sumBy(d, 'total')
    })).value()


    return [per_district_pop, total_pop]
  }

  /*
    Initis the svg, using the totalData (with all districts)
  */
  createGraph(totalData) {

    // append the svg object to the body of the page
    let svg = d3.select("#" + this.graphId)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")")
      .attr("id", "someid")


    // X axis
    let x = d3.scaleBand()
      .range([0, this.width])
      .domain(totalData.map(function(d) {
        return d.xFeature;
      }).sort())
      .padding(0.2);

    // Add X axis
    svg.append("g").attr("class", "axisx")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", this.xAxisPx)
      .attr("transform", this.xAxisTrans)
      .style("text-anchor", "end");

    // Y axis
    let formatValue = d3.format(".2s");
    let y = d3.scaleLinear()
      .domain([0.95 * d3.min(totalData.map((d) => d.total)), d3.max(totalData.map((d) => d.total))])
      .range([this.height, 0])

    // Add Y axis
    svg.append("g").attr("class", "axisy")
      .call(d3.axisLeft(y).tickFormat(function(d) {
        return formatValue(d)
      })).selectAll("text").style("font-size", this.yAxisPx)

    /*
      Since later we will use grouped bars, we also need to initialize the DOM for handling it
      Here, we only have one item per group, since we dead with the overall data
    */
    let g = svg.append('g').attr('id', 'bargroupg')
    let data = totalData
    let groups = _.chain(totalData).map('xFeature').uniq().value().sort()
    var barGroups = g.selectAll("g.layer").data(data);

    // Create the groups
    barGroups.enter().append("g").classed('layer', true)
      .attr("transform", function(d) {
        return "translate(" + x(d.xFeature) + ",0)";
      });

    // Remove bars if update with more data
    barGroups.exit().remove();

    // Select all bars
    var bars = g.selectAll("g.layer").selectAll("rect")
      .data(function(d) {
        return [d]
      });

    // Append the bars which correspond to the group
    bars.enter().append("rect")
      .attr("width", x.bandwidth())
      .attr("x", function(d) {
        return 0;
      })
      .attr("fill", this.color)
      .transition().duration(750)
      .attr("y", function(d) {
        return y(d.total);
      })
      .attr("height", (d) => {
        return this.height - y(d.total);
      });

    bars.exit().remove();
  }

  /*
    Updates the bars and y axis to go either from 0 to max
    or from 0.95*min to max, usually triggerred by the slider "Y axis starting from zero"
  */
  updateYAxis(startingFromZero, transitionDuration = 700) {

    let y = null

    // Should start from zero, recreate axis that starts from zero
    if (startingFromZero) {
      console.log(d3.max(this.currentData.map((d) => d.total)))
      y = d3.scaleLinear()
        .domain([0, d3.max(this.currentData.map((d) => d.total))])
        .range([this.height, 0]);
    // Should start from 0.95*min, recreate axis
    } else {
      y = d3.scaleLinear()
        .domain([0.95 * d3.min(this.currentData.map((d) => d.total)), d3.max(this.currentData.map((d) => d.total))])
        .range([this.height, 0]);
    }

    // Update axis and reapply text
    d3.select("#" + this.graphId).select(".axisy").transition().duration(transitionDuration).call(d3.axisLeft(y)).selectAll("text").style("font-size", this.yAxisPx)

    let data = null


    /*
      If we have multiple districts, need to sort them again to make sure
      that we don't reorder the bars while updating them
    */
    if (this.districts.length == 2) {
      data = this.currentData.sort((el1, el2) => {
        if (el1.xFeature == el2.xFeature) {
          if (el1.name == this.districts[0]) {
            return -1
          } else {
            return 1
          }

        } else {
          if (el1.xFeature < el2.xFeature) {
            return -1
          } else {
            return 1
          }
        }
      })
    // Otherwise we can just sort by the xFeature (usually year) to make sure it stays in the right order
    } else {
      data = _.sortBy(this.currentData, ['xFeature'])
    }

    /*
      Then we do the usual selection, enter, append, exit loop
      to update the bars we had previously with their new height
    */
    let rects = d3.select('#' + this.graphId).select('#bargroupg').selectAll("rect")
      .data(data)

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

  /*
    Called when filtering by districts, update graph given list of districts to show
    len = 0 => show overall
    len = 1 => show single district
    len = 2 => show comparison
  */
  update(districts, callBack = () => {}, transitionDuration = 500) {
    // update districts array from class
    this.districts = districts

    // filter only important districts
    let filtered_dat = _.filter(this.perDistrictData, (d) => districts.includes(d.name))

    /*
      Since we have grouped bars,
      subgroups = districts
      groups = xFeature
    */
    let subgroups = districts //selected districts

    // If we have to show for overall data
    if (districts.length == 0) {
      this.currentData = this.totalData

      // X axis
      let x = d3.scaleBand()
        .range([0, this.width])
        .domain(this.totalData.map(function(d) {
          return d.xFeature;
        }).sort())
        .padding(0.2);


      // Y axis
      let y = d3.scaleLinear()
        .domain([0.95 * d3.min(this.totalData.map((d) => d.total)), d3.max(this.totalData.map((d) => d.total))])
        .range([this.height, 0]);

      // Select data only for overall data
      let data = this.totalData
      let g = d3.select('#' + this.graphId).select('#bargroupg')
      let groups = _.chain(this.totalData).map('xFeature').uniq().value().sort()

      // Update groups for overall data
      var barGroups = g.selectAll("g.layer").data(data);
      barGroups.enter().append("g").classed('layer', true)
        .attr("transform", function(d) {
          return "translate(" + x(d.xFeature) + ",0)";
        });

      /*
        Exit, enter, append loop to update bars for overall data
      */
      // update groups
      barGroups.exit().remove();
      var bars = g.selectAll("g.layer").selectAll("rect")
        .data(function(d) {
          return [d]
        });

      //remove bars no longer present
      bars.exit().remove();

      // update bars
      bars
        .transition().duration(750)
        .attr("y", function(d) {
          return y(d.total);
        })
        .attr("height", (d) => {
          return this.height - y(d.total);
        });



      // update xaxis
      d3.select("#" + this.graphId).select(".axisx").transition().call(d3.axisBottom(x).tickSize(0));

      // update yaxis
      d3.select("#" + this.graphId).select(".axisy")
      .transition()
      .call(d3.axisLeft(y))
      .on('end', callBack)
      .selectAll("text").style("font-size", this.yAxisPx)

      return
    }

    /*
      In this case, may have multiple subgroups, compute them :
    */

    let groups = _.chain(filtered_dat).map('xFeature').uniq().value().sort() // year

    //use the filtered data
    this.currentData = filtered_dat

    // Group the filtered data by the xFeature, and create data points in flattened array (xFeature, district, value)
    let data = (_(this.currentData).groupBy('xFeature').map((d, id) => Object.fromEntries([
      ['xFeature', id]
    ].concat(d.map(i => [i['name'], i['total']])))).value())

    // access svg
    let svg = d3.select('#' + this.graphId + ' svg g')

    // Add X axis
    var x = d3.scaleBand()
      .domain(groups)
      .range([0, this.width])
      .padding([0.2])
    d3.select("#" + this.graphId).select(".axisx").transition().call(d3.axisBottom(x).tickSize(0));

    // Add Y axis
    var y = d3.scaleLinear()
      .domain([0.95 * d3.min(filtered_dat.map((d) => d.total)), d3.max(filtered_dat.map((d) => d.total))])
      .range([this.height, 0]);

    // update y axis
    d3.select("#" + this.graphId).select(".axisy").transition().call(d3.axisLeft(y)).on('end', callBack).selectAll("text").style("font-size", this.yAxisPx);


    // Another scale for subgroup position
    var xSubgroup = d3.scaleBand()
      .domain(subgroups)
      .range([0, x.bandwidth()])
      .padding([0.05])

    // color palette = one color per subgroup
    var color = d3.scaleOrdinal()
      .domain(subgroups)
      .range(['#377eb8', '#e41a1c', '#4daf4a'])


    // select group where our bargroups will be
    let g = d3.select('#' + this.graphId).select('#bargroupg')

    // select our bargroups
    var barGroups = g.selectAll("g.layer")

    // remove old ones
    barGroups.exit().remove();

    // add new data
    barGroups.data(data);

    // create groups corresponding to new data
    barGroups.enter().append("g").classed('layer', true)
      .attr("transform", function(d) {
        return "translate(" + x(d.xFeature) + ",0)";
      });

    // remove old groups
    barGroups.exit().remove();

    // add data for bar in each subgroup
    var bars = g.selectAll("g.layer").selectAll("rect")
      .data(function(d) {
        return subgroups.map(function(key) {
          return {
            key: key,
            value: d[key]
          };
        });
      });


    // create bars for the data
    bars.enter().append("rect")

    // remove bars if we had more data previously
    bars.exit().remove();

    // transition size of bars
    bars.attr("width", xSubgroup.bandwidth())
      .attr("x", function(d) {
        return xSubgroup(d.key);
      })
      .attr("fill", (d) => {
        if (districts.length > 1) {
          return color(d.key);
        } else {
          return this.color
        }
      })
      .transition().duration(750)
      .attr("y", function(d) {
        return y(d.value);
      })
      .attr('width', x.bandwidth())
      .attr("height", (d) => {
        return this.height - y(d.value);
      });

    // apply second time to force width update, d3 issue ?
    bars
      .transition().duration(750)
      .attr("y", function(d) {
        return y(d.value);
      })
      .attr("height", (d) => {
        return this.height - y(d.value);
      });



  }
}

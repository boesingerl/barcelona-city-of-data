class DistrictViz {

  // Constructor for districtviz, given a list of polygons, max of our array is always2 in our case
  constructor(polygons, max=2) {
    this.districts = []
    this.polygons = polygons
    this.colors = ['red','blue']
  }

  /* Called when clicking over a district
      Updates color
      Adds it to district array
      Updates text inside table
      calls index.js update method to update bar charts
    */
  onClick(d){
    // If we click on already existing one, remove it
    if(this.districts.includes(d)){

      //get fill color
      let obj = this.polygons[this.districts[0]]['polygon']['_layers']
      let fillColor = obj[Object.keys(obj)[0]]['options']['fillColor']

      //set outline color to fill color
      this.polygons[d]['polygon'].setStyle({color:fillColor})

      //remove the clicked district from the array
      this.districts = this.districts.filter(dis => dis != d)

      //reset colors for the other districts (red, blue)
      if(this.districts.length > 0){
        this.polygons[this.districts[0]]['polygon'].setStyle({color:'blue'})
        if(this.districts.length > 1){
          this.polygons[this.districts[1]]['polygon'].setStyle({color:'red'})
        }
      }

      // call update method from index.js to update bar graphs
      update(this.districts)
      return
    }
    // add new district on click
    let newlen = this.districts.push(d)

    // remove the previous if size > 2 (can only select two districts, shift)
    if(newlen > 2){
      let obj = this.polygons[this.districts[0]]['polygon']['_layers']
      let fillColor = obj[Object.keys(obj)[0]]['options']['fillColor']

      // update color of removed district
      this.polygons[this.districts[0]]['polygon'].setStyle({color:fillColor})
      this.districts.shift()
    }
    // update color of first district in array
    this.polygons[this.districts[0]]['polygon'].setStyle({color:'blue'})

    // update color of first district in array
    if(newlen > 1){
      this.polygons[this.districts[1]]['polygon'].setStyle({color:'red'})
    }

    // calls our update method, to update the radar chart and the table
    this.updatePlot(this.districts)

    //calling twice to force update, due to an issue with update of d3
    update(this.districts)
    update(this.districts)
  }

  /* Called when hovering over a district*/
  async onHover(d){
    if(!this.districts.includes(d) && this.districts.length < 2){
      let arrayCopy = [...this.districts]
      arrayCopy.push(d)
      this.updatePlot(arrayCopy)
    }
  }

  /* Updates the radar chart and the table*/
  async updatePlot(districts){

    // datastructures used to setup the maximum of the categories among districts
    const categories = ['population', 'density', 'neighborhoods', 'area']
    let maxs = new Map()

    // Get the maximum values over the two districts to determine if we need to set text to bold
    if(districts.length == 2){
      let query_district = (i,cat) => +(this.polygons[districts[i]][cat].replace(',', ''))
      let query_length   = (i,cat) => this.polygons[districts[i]][cat].length

      maxs['population'] = d3.maxIndex([query_district(0,'population'), query_district(1, 'population')])
      maxs['density'] = d3.maxIndex([query_district(0,'density'), query_district(1, 'density')])
      maxs['area'] = d3.maxIndex([query_district(0,'area'), query_district(1, 'area')])
      maxs['neighborhoods'] = d3.maxIndex([query_length(0,'neighborhoods'), query_length(1, 'neighborhoods')])

    }

    // reset style for non selected districts
    for(let i = 0; i < 2; i++){
      d3.select("#name" + i).style('text-shadow', 'none').style('font-weight', 'normal')
      d3.select("#pop" + i).style('text-shadow', 'none').style('font-weight', 'normal')
      d3.select("#dens" + i).style('text-shadow', 'none').style('font-weight', 'normal')
      d3.select("#neigh" + i).style('text-shadow', 'none').style('font-weight', 'normal')
      d3.select("#area" + i).style('text-shadow', 'none').style('font-weight', 'normal')
    }

    // Iterate over the districts and set the text
    for(let i = 0; i < districts.length; i++){
      const d = districts[i]
      const obj = this.polygons[d]

      // set color depending on district number
      const color = i == 0 ? 'blue': 'red'
      const shadowing = `0 0 1px ${color}, 0 0 1px ${color}, 0 0 1px ${color}, 0 0 1px ${color}`

      // formatting that sets to bold if max value among districts, and adds color corresponding to district
      let format = (x,cat) => x.style('opacity','0')
                          .transition()
                          .duration(600)
                          .style('opacity','1')
                          .style('font-weight', () => i == maxs[cat] ? 'bold' : 'normal')
                          .style('text-shadow', () => i == maxs[cat] ? shadowing : 'none')



      // update and format text
      format(d3.select("#name" + i).text(d), '').style('text-shadow', shadowing)
      format(d3.select("#pop" + i).text(obj['population']), 'population')
      format(d3.select("#dens" + i).text(obj['density']), 'density')
      format(d3.select("#neigh" + i).text(obj['neighborhoods'].length), 'neighborhoods')
      format(d3.select("#area" + i).text(obj['area']), 'area')




      // Draw new radar chart
      drawplot(districts,district_data)

    }
  }

  // Accesser for current list of districts
  getDistricts(){
    return [...this.districts]
  }
}


/*
   Setup radar chart default params
   Setup default colors (blue, red) as well as size
   Load data for radarchart inside district_data
*/
RadarChart.defaultConfig.color = (i) => {return ['blue','red', 'orange'][i]}
RadarChart.defaultConfig.radius = 3;
RadarChart.defaultConfig.w = 300;
RadarChart.defaultConfig.h = 300;

// Unfortunately, need to create a new RadarChart each time
let drawplot = async (districts,district_data) => {
  // Only keep data from the selected districts
  let filtered = (district_data.filter(x => districts.includes(x.className)))
  let data = filtered

  // Order data so as to keep colors in order
  if(data.length == 2 && data[0].className != districts[0]){
    data = [data[1], data[0]]
  }
  // Draw radar chart
  RadarChart.draw(".chart-container", data);
};

// Library uses old d3js so can't use promise
var district_data = null

// Load data using old d3js for Radarchart
let data = d3old.csv("./data/district_comp.csv", function(d) {
  return {
    className: d['District.Name'], // convert "Year" column to Date
    axes : [
      {axis:'Life expectancy', value:d['life_exp']},
      {axis:'Population', value:d['pop']},
      {axis:'Births/hab', value:d['births_per']},
      {axis:"Unemployment score", value:d['unemployed_score']},
      {axis:'Deaths score', value:d['deaths_score']},
  ]
  };
}, function(error, data) {
    district_data = data
    drawplot(['Zero'], district_data)
  });

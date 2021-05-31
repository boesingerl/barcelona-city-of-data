'use strict';

/********************************
*
*    Adding bar graphs and colors
*
*********************************/

// Color map for our graphs
const colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"]

// Cycling color function
function getNewColor() {
  let i = -1
  return () => {
    i += 1;
    return colors[i % 10]
  }
}

// get instance of cyclicng color function
let changingColor = getNewColor()


/* Function that generates all graphs which we add inside the bar graph container*/
let load_graphs = async function(){
  // wait for polygons to load first, all code related to the map is inside choropleth.js
  // we made the choice of not using modules because they are very related, so sharing the namespace is not that much of an issue
  await poly
  // Create all bar graphs, all these are handpicked
  const graphPop = new HistGraph("data/population.csv", "graphPop", {
    "color": changingColor()
  })
  const graphBirth = new HistGraph("data/births.csv", "graphBirth", {
    "color": changingColor()
  })
  const graphDeath = new HistGraph("data/deaths.csv", "graphDeath", {
    "color": changingColor()
  })

  const graphUnemployment = new HistGraph("data/unemployment.csv", "graphUnemployment", {
    "color": changingColor(),
    "filterMonth": "January"
  })
  const graphImmigrants = new HistGraph("data/immigrants_by_nationality.csv", "graphImmigrants", {
    "color": changingColor()
  })
  const graphPopGender = new HistGraph("data/population.csv", "graphPopGender", {
    "xFeature": "Gender",
    "color": changingColor(),
    "filterYear": 2017
  })

  const graphPopAge = new HistGraph("data/population.csv", "graphPopAge", {
    "xFeature": "Age",
    "color": changingColor(),
    "xAxisPx":"12px",
    "xAxisTrans": "translate(-10,10)rotate(-90)"
  })
  const graphDeathAge = new HistGraph("data/deaths.csv", "graphDeathAge", {
    "xFeature": "Age",
    "color": changingColor(),
    "xAxisPx":"12px",
    "xAxisTrans": "translate(-10,10)rotate(-90)"
  })

  const graphImmigrantAge = new HistGraph("data/immigrants_emigrants_by_age.csv", "graphImmigrantAge", {
    "xFeature": "Age",
    "color": changingColor(),
    "mainFeature":"Immigrants",
    "xAxisPx":"12px",
    "xAxisTrans": "translate(-10,10)rotate(-90)"
  })
  return [graphPop, graphBirth, graphDeath, graphUnemployment, graphImmigrants, graphPopGender, graphPopAge, graphDeathAge, graphImmigrantAge]
}

// Load all graphs
const allGraphs = load_graphs()


/*
After having loaded the graphs, need to update the size of the container to fit the screen
We force responsiveness through a scale transform since our svgs have fixed size
*/
allGraphs.then(() => {
  setTimeout(function(){ resizeGraphContainer(); }, 1000);

})
// Call update function of bargraph, update text, and color on district selection
async function update(districts_) {
  //reset text first
  for(let i = 0; i < 2; i++){
    d3.select('#districtname' + i).text('')
  }

  // If we want to show for overall update it
  if (districts_.length == 0){
    d3.select('#selectionText').text(`Currently showing Overall`)
  }else{

    //write text for main
    d3.select('#selectionText').text(`Currently showing : `)

    //write text for each district
    for(let i = 0; i < districts_.length; i++){
      d3.select('#districtname' + i).text(districts_[i] + (i < districts_.length-1 ? ', ' : '' ))
    }

  }

  //update all graphs
  //also reset y axis starting from zero if switch is active
  allGraphs.then(graphs => graphs.map(x => x.update(districts_, () => {
    if($('#flexSwitchCheckDefault').is(':checked')){
      allGraphs.then(graphs => graphs.map(x => x.updateYAxis(true)))
    }
  })))

}

// Update y axis of bar graphs on switch
$('#flexSwitchCheckDefault').change(function() {
  allGraphs.then(graphs => graphs.map(x => x.updateYAxis(this.checked)))
});

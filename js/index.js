/********************************
*
*     Leaflet map definition
*
*********************************/

// Create bounds so we can't zoom too far
var bounds = L.latLngBounds(L.latLng(41.47308784765205, 2.365493774414063), L.latLng(41.26696898724201, 1.953506497265627))
var mymap = L.map('mapid', {
  maxBounds: bounds
}).setView([41.37, 2.1592], 11);

// Adding white background map layer
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
  maxZoom: 18,
  minZoom: 11,
  id: 'mapbox/light-v10',
  tileSize: 512,
  zoomOffset: -1
}).addTo(mymap);

// All geojson files we have to load
let districts = {
  'Nou Barris': 'nou-barris.json',
  'Eixample': 'eixample.json',
  'Ciutat Vella': 'ciutat-vella.json',
  'Gràcia': 'gracia.json',
  'Sant Martí': 'sant-marti.json',
  'Sant Andreu': 'sant-andreu.json',
  'Les Corts': 'les-corts.json',
  'Horta-Guinardó': 'horta-guinardo.json',
  'Sarrià-Sant Gervasi': 'sarria-sant-gervasi.json',
  'Sants-Montjuïc': 'sants-montjuic.json',
}

mymap.on('drag', function() {
  mymap.panInsideBounds(bounds, {
    animate: true
  });
});

mymap.getRenderer(mymap).options.padding = 0.5;


// On hover function
function highlight(e) {
    var layer = e.target;
    layer.setStyle({
        fillOpacity: 0.7,
        weight:3
    });
}

// On hover release
function resetHighlight(e) {
  var layer = e.target;
  layer.setStyle({
      fillOpacity: 0.5,
      weight:2
  });
}

// Single polygon loading function
let load_poly = async (name, filename, polygons) => {
  let coords = await fetch(`polygons/${filename}`).then(res => res.json()).then(json => json['geometry'])
  let polygon = L.geoJSON(coords).addTo(mymap);

  polygon.setStyle({fillColor: '#7CC6FE',fillOpacity: 0.5, weight: 2 })
  polygon.on({
      mouseover: highlight,
      mouseout:  resetHighlight
  })

  polygons[name] = polygon;
}


// Loading all polyhons
let load_all_poly = async function() {
  let polygons = {};
  for (const [name, filename] of Object.entries(districts)) {
    await load_poly(name, filename, polygons);
  }
  return polygons;
};

var poly = load_all_poly()

// Add onclick and tooltips when clicking / hovering over district
poly.then(polygons => {
  for (const [district, polygon] of Object.entries(polygons)) {
    polygon.on('click', () => update(district))
    polygon.bindTooltip(district, {permanent:false, direction:"auto"});
  }
})

/********************************
*
*     Moving map on-scroll
*
*********************************/

// Only add it once document loaded
document.addEventListener('DOMContentLoaded', function() {
  // select all container
  const introContainer = document.querySelector('.intro');
  const videoContainer = document.querySelector('.popout-video');
  const video = videoContainer.querySelector('#mapid');
  const graphContainer = document.querySelector('#graphContainer')
  let videoHeight = videoContainer.offsetHeight;

  const closeVideoBtn = document.querySelector('.close-video');

  let popOut = true;
  let ignoreThis = true;

  introContainer.style.height = `${videoHeight}px`;

  // On scroll
  window.addEventListener('scroll', function(e) {
    if (window.scrollY > videoHeight + 200) {
      // PopOut map to left
      if (popOut) {

        graphContainer.classList.remove('mapleftmarginundo');
        graphContainer.classList.add('mapleftmargin');

        videoContainer.classList.add('popout-video--popout');
        // set video container off the screen for the slide in animation
        videoContainer.style.top = `-${videoHeight}px`;
        ignoreThis = false;
        mymap.invalidateSize()
        mymap.setView([41.37, 2.1592], 11);
        console.log(d3.select('#mapid').style('width', '100%'))
      }
      // Otherwise move map back up
    } else {
      console.log(d3.select('#mapid').style('width', '600px'))
      graphContainer.classList.remove('mapleftmargin');
      if(!ignoreThis){
        graphContainer.classList.add('mapleftmarginundo');
      }
      videoContainer.classList.remove('popout-video--popout');
      videoContainer.style.top = `0px`;
      popOut = true;
    }
  });


  window.addEventListener('resize', function() {
    videoHeight = videoContainer.offsetHeight;
    introContainer.style.height = `${videoHeight}px`;

    if(window.scrollY > videoHeight + 200){
      console.log('resizing')
      mymap.invalidateSize()
      mymap.setView([41.37, 2.1592], 11);
    }

  });
});


/********************************
*
*    Adding graphs and colors
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

let changingColor = getNewColor()

let load_graphs = async function(){
  //wait for polygons to load first
  await poly
  // Create all bar graphs
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
    "color": changingColor()
  })
  const graphImmigrants = new HistGraph("data/immigrants_by_nationality.csv", "graphImmigrants", {
    "color": changingColor()
  })
  const graphPopGender = new HistGraph("data/population.csv", "graphPopGender", {
    "yearFeature": "Gender",
    "color": changingColor()
  })

  const graphPopAge = new HistGraph("data/population.csv", "graphPopAge", {
    "yearFeature": "Age",
    "color": changingColor()
  })
  const graphDeathAge = new HistGraph("data/deaths.csv", "graphDeathAge", {
    "yearFeature": "Age",
    "color": changingColor()
  })

  const graphImmigrantAge = new HistGraph("data/immigrants_emigrants_by_age.csv", "graphImmigrantAge", {
    "yearFeature": "Age",
    "color": changingColor(),
    "mainFeature":"Immigrants"
  })

  return [graphPop, graphBirth, graphDeath, graphUnemployment, graphImmigrants, graphPopGender, graphPopAge, graphDeathAge, graphImmigrantAge]
}


const allGraphs = load_graphs()

// Call update function of bargraph, update text, and color on district selection
function update(district) {
  d3.select('#selectionText').text(`Currently showing ${district}`)
  allGraphs.then(graphs => graphs.map(x => x.update(district, () => {
    if($('#flexSwitchCheckDefault').is(':checked')){
      allGraphs.then(graphs => graphs.map(x => x.updateYAxis(true)))
    }
  })))
  poly.then(pol => {

    Object.values(pol).forEach(p => p.setStyle({fillColor:'#7CC6FE', weight:2}))

    pol[district].setStyle({
    fillColor: "#8789C0",
    weight:3
  })})

}

// Update y axis of bar graphs on switch
$('#flexSwitchCheckDefault').change(function() {
  allGraphs.then(graphs => graphs.map(x => x.updateYAxis(this.checked)))
});

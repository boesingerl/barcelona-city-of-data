'use strict';

/********************************
*
*    Render leaflet map
*
*********************************/

/**
* Map Latitude and Longitude bounds
*/

const bounds = L.latLngBounds(L.latLng(41.49983532494226,2.597236633300781), L.latLng(41.25974300098081,2.0259475708007817))
let mymap = L.map('mapid', { zoomControl: false }).setView([41.37, 2.1592], 12).setMaxBounds(bounds);

let polygonValues = {}
let polygonsInfo = {}
const PER_HABITANTS = 10000


L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
  maxZoom: 18,
  minZoom: 12,
  id: 'mapbox/light-v10',
  tileSize: 512,
  zoomOffset: -1
}).addTo(mymap);

//Districts with their corresponding geojson file
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
    animate: false
  });
});
/**
* Save the current color for each districts such that we can keep the selected ones selected
*/
let districtColors = {}
/**
* Highlights a district if hovered on
*/
function highlight(e, district, perHab) {
    let layer = e.target;
    let currColor = e.layer.options.color
    districtColors[district] = currColor
    layer.setStyle({
        weight:4,
        fillOpacity: 0.7
    });
    info.update(district,perHab)
}


/**
* Resets a district style if hovered off
*/
function resetHighlight(e,district) {
  let layer = e.target;
  let currColor = e.layer.options.color
  districtColors[district] = currColor
  layer.setStyle({
      weight:3,
      fillOpacity: 0.5,
  });
  info.update();
}

/**
* Resizes the graph contained to fit the window size
*/
function resizeGraphContainer(){
  let containerHeight = d3.select('#graphContainer').style('height')
  containerHeight = +(containerHeight.split('px')[0])
  let windowHeight = window.innerHeight
  let scaling = (windowHeight / containerHeight)*0.8;

  d3.select('#graphContainer').style('transform', `scale(${scaling}) translate(0,-50%)`)
}

window.addEventListener('resize', resizeGraphContainer);

mymap.getRenderer(mymap).options.padding = 0.5;

/**
* Loads a single polygon from the geojson and initializes it
*/
let loadPolygon = async (name, filename, polygons) => {
  // Load all informations inside the polygons geojson
  let [coords, population, area, neighborhoods, density] =  await fetch(`polygons/${filename}`)
            .then(res => res.json())
            .then(json => [json['geometry'],json['extratags']['population'],json['extratags']['area'],json['extratags']['neighborhoods'], json['extratags']['density']])
  // create polygon in the map
  let polygon = L.geoJSON(coords).addTo(mymap);
  let perHab = filename.includes('population')

  // update the on mouseover and onclick for choropleth
  polygon.on({
      mouseover: e => highlight(e,name,false),
      mouseout: e => resetHighlight(e,name)
  });

  // create a dict of polygons, to which we add the values for all districts, used by DistrictViz in district.js
  polygons[name] = polygon;
  polygonsInfo[name] = {polygon:polygon, population:population, area:area, neighborhoods:neighborhoods, density:density};
  polygonValues[name] = 0

}

/**
*  Iterate over all polygons and loads them all
*/

let f = async function() {
  let polygons = {};
  for (const [name, filename] of Object.entries(districts)) {
    await loadPolygon(name, filename, polygons);
  }
  return polygons;
};

/**
* List of all polygons (promise)
*/
let poly = f()

/**
* Add onClick and onHover listeners once all polygons
* have been loaded and correctlly initialized
* DistrictViz is implemented inside district.js
*/
poly.then(polygons => {
  let viz = new DistrictViz(polygonsInfo,2)
  for (const [district, obj] of Object.entries(polygonsInfo)) {
    obj['polygon'].on('click', () => viz.onClick(district))
    obj['polygon'].on('mouseover', () => viz.onHover(district))
  }
});

// create DOM element to place the choropleth legend
let div = L.DomUtil.create('div', 'info legend bg-dark text-white')
let legend = L.control({position: 'topleft'});
let info = L.control({position: 'topleft'});

/**
* Util function to render numbers nicely
*/
function numberWithSpaces(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
* Util function to compute a range
*/
function range(start, end, step) {
  let ans = [];
  for (let i = start; i <= end; i+=step) {
      ans.push(i);
  }
  return ans;
}

/*************************************************************
*
* Leaflet : Add information on hovered distrinct on top left
*
**************************************************************/

info.onAdd = function (mymap) {
    this._div = L.DomUtil.create('div', 'info bg-dark text-white text-center', L.DomUtil.get('')); // create a div with a class "info"
    this.update();
    return this._div;
};

/**
* Updates the info content according to witch polygons
* is hovered on, on the choropleth map.
* Takes into account if the attribute is represented for 1000 habitants or not
*/
info.update = function (district,perHabitant) {
  let value = polygonValues[district];

  if(this._div){
  this._div.innerHTML =  (district ?
      '<b>' + district + '</b><br />' + numberWithSpaces(value) +  " " +  $('#selectionBoxType option:selected').text() +
          (perHabitant ? " for " + PER_HABITANTS.toString()+ " inhabitants" : " ")
      : '<b> Hover over a district </b>');
   }
};


/*************************************************************
*
* Change represented attribute on the map alongside the legend and them
* top left information
*
**************************************************************/
async function setFeature(datapath, date){
  // get list of polygons and data
  let polygons = await poly
  console.log(datapath)
  let data = await d3.csv(datapath)
  date = date.toString()
  let filteredData = await _.filter(data,  {"Year" : date});
  // obtain data by district by summing up values of column Number in csv

  let districtValues =_(filteredData)
    .groupBy('District.Name')
    .map((d, id) => ({
      district: id,
      total: _.sumBy(d, (i) => Number(i['Number']))
    })).value()

  // update map of values
  let mapValues = districtValues.reduce((map, obj) => {map[obj.district] = obj.total; return map;}, {})
  console.log(datapath)
  let perHabitant = !datapath.includes('population')
  console.log(perHabitant)
  let dataPerHabitant = {}


  if(perHabitant){
    let popData = await d3.csv('data/population.csv')

    let popFilteredData = await _.filter(popData,  {"Year" : date});
    // obtain data by district by summing up values of column Number in csv

    let popDistrictValues =_(popFilteredData)
      .groupBy('District.Name')
      .map((d, id) => ({
        district: id,
        total: _.sumBy(d, (i) => Number(i['Number']))
      })).value()

    // update map of values
    popDistrictValues = popDistrictValues.reduce((map, obj) => {map[obj.district] = obj.total; return map;}, {})


    for (const[district, value] of Object.entries(mapValues)) {
      let population = popDistrictValues[district]
      dataPerHabitant[district] =  Math.round(((parseInt(value)/ parseInt(population) ) * PER_HABITANTS))
    }
    mapValues = dataPerHabitant
  }

  // compute min/max and create scale accordingly
  const extent = d3.extent(_.values(mapValues));


  const legendColors = d3.scaleSequential(extent,[0.3,1]);

  // color scale
  const col = (x) => d3.interpolateGnBu(legendColors(x))

  // iterate over polygons, and update their colors
  for (const [district, polygon] of Object.entries(polygons)) {
    const value = parseInt(mapValues[district])
    polygonValues[district] = value
    let color = col(value)
    let fillColor = color
    let highlightColor = districtColors[district]
    //Keep the highlighting of the selected districts
    if(highlightColor == 'blue' || highlightColor == 'red'){
      color = highlightColor
    }
    polygon.setStyle({
      fillColor: fillColor,
      fillOpacity: 0.6,
      opacity: 0.6,
      color: color
    })

    // change mouseover and mouseout actions according to the attributs format
    polygon.on({
        mouseover: e => highlight(e,district,perHabitant),
        mouseout: e => resetHighlight(e,district)
    });
  }

  /**
  * Add corresponding legend to the map
  */
  legend.onAdd = function (map) {
      div.innerHTML = ' '

      const rounding = Math.pow(10, extent[1].toString(10).length - 2)

      const cells = 5;
      const min = Math.round(extent[0] / rounding) * rounding;
      const max = Math.ceil(extent[1] / rounding) * rounding;
      const step = (max - min) / cells;
      const r =  range(min,max,step).map(x => Math.round(x));



      // loop through our density intervals and generate a label with a colored square for each interval
      for (let i = 0; i < r.length - 1 ; i++) {
          div.innerHTML +=
          '<i style="background:' + col((r[i] + r[i + 1]) / 2) + '"></i> ' +
       numberWithSpaces(r[i]) + ' &ndash; ' + numberWithSpaces(r[i + 1]) + '<br>';
      }

      return div;
  };

  legend.addTo(mymap);
  info.addTo(mymap);

}

// default : set to population and year to 2017
setFeature('data/population.csv',"2017")


// hides not years for some data attributes where we miss some data
function hideDates() {
  jQuery("#selectionBoxDate option").each(function(){
      if(this.value == "2013" || this.value == "2014"){
          jQuery(this).hide();
      }
  });

}
// on change of select value for the dataset, update heatmap, and text
$('#selectionBoxType').on('change', function(e) {

  let currentYear = $('#selectionBoxDate option:selected').val()
  if(this.value == "data/deaths.csv" && currentYear < 2015) {
    currentYear = 2015
    $("#selectionBoxDate").val("2015").change();
    hideDates()

  } else {
    jQuery("#selectionBoxDate option").each(function(){
      jQuery(this).show();

    });
  }
  setFeature(this.value,currentYear)
});

// on change of select value for the year, update heatmap, and text
$('#selectionBoxDate').on('change', function(e) {

  let currentData = $('#selectionBoxType option:selected').val()
  if(this.value < 2015 && currentData == "data/deaths.csv") {
    $("#selectionBoxDate").val("2015").change();
    hideDates()
  }else{
    jQuery("#selectionBoxDate option").each(function(){
      jQuery(this).show();

    });

  }
  setFeature(currentData, this.value)

});

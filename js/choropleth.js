
/********************************
*
*    Render leaflet map
*
*********************************/

var bounds = L.latLngBounds(L.latLng(41.47308784765205, 2.365493774414063), L.latLng(41.26696898724201, 1.953506497265627))
var mymap = L.map('mapid', {
  maxBounds: bounds
}).setView([41.37, 2.1592], 11);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
  maxZoom: 18,
  minZoom: 11,
  id: 'mapbox/light-v10',
  tileSize: 512,
  zoomOffset: -1
}).addTo(mymap);

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
 On hover : update style
*/
function highlight(e, district) {
    var layer = e.target;
    layer.setStyle({
        weight:4,
        fillOpacity: 0.7
    });
    info.update(district)

}

var polygonValues = {}

/**
 On hover release : update style
*/
function resetHighlight(e) {
  var layer = e.target;
  layer.setStyle({
      weight:3,
      fillOpacity: 0.5
  });
  info.update();
}

mymap.getRenderer(mymap).options.padding = 0.5;

// Load a single polygon from geojson
let load_poly = async (name, filename, polygons) => {
  let coords = await fetch(`../polygons/${filename}`).then(res => res.json()).then(json => json['geometry'])
  let polygon = L.geoJSON(coords).addTo(mymap);

  polygon.on({
      mouseover: e => highlight(e,name),
      mouseout: resetHighlight
  });
  polygons[name] = polygon;
  polygonValues[name] = 0

}


// Iterate over all polygons and load them all
let f = async function() {
  let polygons = {};
  for (const [name, filename] of Object.entries(districts)) {
    await load_poly(name, filename, polygons);
  }
  return polygons;
};

// List of all polygons (promise)
var poly = f()

var info = L.control();

/**
 Util function to render numbers nicely
*/
function numberWithSpaces(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/*************************************************************
*
* Leaflet : Add information on hovered distrinct on top right
*
**************************************************************/

info.onAdd = function (mymap) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
//Needs to contain the first selected element text
var text = "Population"
info.update = function (district) {

  let value = polygonValues[district];
  this._div.innerHTML =  (district ?
      '<b>' + district + '</b><br />' + numberWithSpaces(value) +  " " + text
      : '<b> Hover over a district </b>');
};

info.addTo(mymap);


/*************************************
*
* Leaflet : Add legend on bottom right
*
**************************************/

var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 10, 20, 50, 100, 200, 500, 1000],
        labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:'  + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(mymap)



/**

 Computes values for new feature, and updates heatmap accordingly

*/
async function setFeature(datapath){
  // Get list of polygons and data
  let polygons = await poly
  let data = await d3.csv(datapath)

  // Obtain data by district by summing up values of column Number in csv
  let districtValues = _(data)
    .groupBy('District.Name')
    .map((d, id) => ({
      district: id,
      total: _.sumBy(d, (i) => Number(i['Number']))
    })).value()

  // Update map of values
  let mapValues = districtValues.reduce((map, obj) => {map[obj.district] = obj.total; return map;}, {})

  // Compute min/max and create scale accordingly
  const extent = d3.extent(_.values(mapValues));
  const reds = d3.scaleLinear(extent, [0.3, 0.8])
  // Color scale function
  const col = (x) => d3.interpolateReds(reds(x))
  //Iterate over polygons, and update color
  for (const [district, polygon] of Object.entries(polygons)) {
    const num_acc = parseInt(mapValues[district])
    polygonValues[district] = num_acc
    polygon.bindPopup(`District ${district} : ${num_acc}`)
    let s = col(num_acc)
    polygon.setStyle({
      fillColor: s,
      fillOpacity: 0.5,
      opacity: 0.6,
      color: s
    })
}
}

// Default : set to population
setFeature('../data/population.csv')

// On change of select value, update heatmap, and text
$('select').on('change', function(e) {
  setFeature(this.value)
  text = this.options[this.selectedIndex].text;
});

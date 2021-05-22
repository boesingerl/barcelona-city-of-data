
/********************************
*
*    Render leaflet map
*
*********************************/

//var bounds = L.latLngBounds(L.latLng(41.47308784765205, 2.365493774414063), L.latLng(41.26696898724201, 1.953506497265627))

var bounds = L.latLngBounds(L.latLng(41.49983532494226,2.597236633300781), L.latLng(41.25974300098081,2.0259475708007817))

//var bounds = L.latLngBounds(L.latLng(5.47308784765205, 2.365493774414063), L.latLng(41.26696898724201, 1.953506497265627))
//var mymap = L.map('mapid').setView([41.37, 2.1592], 11);

var mymap = L.map('mapid', { zoomControl: false }).setView([41.37, 2.1592], 12).setMaxBounds(bounds);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
  maxZoom: 18,
  minZoom: 12,
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
var polygons_info = {}
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

window.addEventListener('resize', function() {
  //console.log(d3.select('#graphContainer').style('height'))
  //console.log(window.innerHeight)
  //d3.select('#graphContainer').style('transform', 'scale(0.1)')

});

mymap.getRenderer(mymap).options.padding = 0.5;

// Load a single polygon from geojson
let load_poly = async (name, filename, polygons) => {
  let [coords, population, area, neighborhoods, density] =  await fetch(`../polygons/${filename}`)
            .then(res => res.json())
            .then(json => [json['geometry'],json['extratags']['population'],json['extratags']['area'],json['extratags']['neighborhoods'], json['extratags']['density']])
  let polygon = L.geoJSON(coords).addTo(mymap);

  polygon.on({
      mouseover: e => highlight(e,name),
      mouseout: resetHighlight
  });
  polygon.on('click', () => update(name))
  polygons[name] = polygon;
  polygons_info[name] = {polygon:polygon, population:population, area:area, neighborhoods:neighborhoods, density:density};
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


poly.then(polygons => {
  let viz = new DistrictViz(polygons_info,2)
  for (const [district, obj] of Object.entries(polygons_info)) {
    obj['polygon'].on('click', () => viz.onClick(district))
    obj['polygon'].on('mouseover', () => viz.onHover(district))
  }
});


var div = L.DomUtil.create('div', 'info legend bg-dark text-white')
var legend = L.control({position: 'topleft'});
var info = L.control({position: 'topleft'});

/**
 Util function to render numbers nicely
*/
function numberWithSpaces(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 Util function to compute a range
*/
function range(start, end, step) {
  var ans = [];
  for (let i = start; i <= end; i+=step) {
      ans.push(i);
  }
  return ans;
}

/*************************************************************
*
* Leaflet : Add information on hovered distrinct on top right
*
**************************************************************/

info.onAdd = function (mymap) {
    this._div = L.DomUtil.create('div', 'info bg-dark text-white text-center', L.DomUtil.get('')); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
//Needs to contain the first selected element text
var selected = $('select option:selected').text()
info.update = function (district) {

  let value = polygonValues[district];
  this._div.innerHTML =  (district ?
      '<b>' + district + '</b><br />' + numberWithSpaces(value) +  " " + selected
      : '<b> Hover over a district </b>');
};




/*************************************
*
* Leaflet : Add legend on bottom right
*
**************************************/




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


  const legendColors = d3.scaleSequential(extent,[0.3,1]);

  // Color scale function
  const col = (x) => d3.interpolateGnBu(legendColors(x))
  //Iterate over polygons, and update color
  for (const [district, polygon] of Object.entries(polygons)) {
    const num_acc = parseInt(mapValues[district])
    polygonValues[district] = num_acc
    let s = col(num_acc)
    polygon.setStyle({
      fillColor: s,
      fillOpacity: 0.6,
      opacity: 0.6,
      color: s
    })
  }






  legend.onAdd = function (map) {
      div.innerHTML = ' '

      const rounding = Math.pow(10, extent[1].toString(10).length - 2)
      const cells = 5;
      const min = Math.round(extent[0] / rounding) * rounding;
      const max = Math.ceil(extent[1] / rounding) * rounding;

      const step = (max - min) / cells;
      const r =  range(min,max,step);


      // loop through our density intervals and generate a label with a colored square for each interval
      for (var i = 0; i < r.length - 1 ; i++) {
          div.innerHTML +=
          '<i style="background:' + col((r[i] + r[i + 1]) / 2) + '"></i> ' +
       numberWithSpaces(r[i]) + ' &ndash; ' + numberWithSpaces(r[i + 1]) + '<br>';
      }

      return div;
  };

  legend.addTo(mymap);
  info.addTo(mymap);



}



// Default : set to population
setFeature('../data/population.csv')

// On change of select value, update heatmap, and text
$('select').on('change', function(e) {
  setFeature(this.value)
  text = this.options[this.selectedIndex].text;
});

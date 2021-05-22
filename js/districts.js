/*
  var bounds = L.latLngBounds(L.latLng(41.47308784765205, 2.365493774414063),L.latLng(41.26696898724201, 1.953506497265627))
	var mymap = L.map('mapid',{
    maxBounds: bounds
  }).setView([41.37,2.1592], 11);

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
    mymap.panInsideBounds(bounds, {animate: false});
  });

  mymap.getRenderer(mymap).options.padding = 0.5;

  /**
   On hover : update style
  */
  /*
  function highlight(e) {
      var layer = e.target;
      layer.setStyle({
          weight:3,
          fillOpacity: 0.7
      });
  }*/

  /**
   On hover release : update style
  *//*
  function resetHighlight(e) {
    var layer = e.target;
    layer.setStyle({
        weight:2,
        fillOpacity: 0.5
    });
  }

  let load_poly = async (name,filename, polygons) => {
      let [coords, population, area, neighborhoods, density] =  await fetch(`../polygons/${filename}`)
                .then(res => res.json())
                .then(json => [json['geometry'],json['extratags']['population'],json['extratags']['area'],json['extratags']['neighborhoods'], json['extratags']['density']])

      let polygon = L.geoJSON(coords).addTo(mymap);
      polygon.setStyle({fillColor: '#7CC6FE',fillOpacity: 0.5, weight: 2 })
      polygon.on({
          mouseover: e => highlight(e,name),
          mouseout: resetHighlight
      });
      polygons[name] = {polygon:polygon, population:population, area:area, neighborhoods:neighborhoods, density:density};
  }


let f = async function() {
  let polygons = {};
  for (const [name, filename] of Object.entries(districts)) {
      await load_poly(name,filename,polygons);
  }
  return polygons;
};
*/
class DistrictViz {

  constructor(polygons, max=2) {
    this.districts = []
    this.polygons = polygons
    this.colors = ['red','blue']
  }

  onClick(d){
    if(this.districts.includes(d)){
      this.districts = this.districts.filter(dis => dis != d)
      return
    }
    let newlen = this.districts.push(d)
    if(newlen > 2){
      //this.polygons[this.districts[0]]['polygon'].setStyle({fillColor:'#7CC6FE'})
      this.districts.shift()
    }
    console.log(this.districts)
    this.updatePlot(this.districts)
  }

  onHover(d){
    if(!this.districts.includes(d) && this.districts.length < 2){
      let arrayCopy = [...this.districts]
      arrayCopy.push(d)
      this.updatePlot(arrayCopy)
    }
  }
  updatePlot(districts){
    for (const [district, obj] of Object.entries(this.polygons)) {
      //obj['polygon'].setStyle({fillColor:'#7CC6FE'})
    }
    for(let i = 0; i < districts.length; i++){
      const d = districts[i]
      const obj = this.polygons[d]
      //obj['polygon'].setStyle({fillColor:this.colors[i]})
      d3.select("#name" + i).text(d)
      d3.select("#pop" + i).text(obj['population'])
      d3.select("#dens" + i).text(obj['density'])
      d3.select("#neigh" + i).text(obj['neighborhoods'].length)
      d3.select("#area" + i).text(obj['area'])


      let drawplot = async () => {
        let filtered = (district_data.filter(x => districts.includes(x.className)))
        let data = filtered
        if(data.length == 2 && data[0].className != districts[0]){
          data = [data[1], data[0]]
        }
        RadarChart.draw(".chart-container", data);
      };
      //drawplot()

    }
  }

  getDistricts(){
    return [...this.districts]
  }
}

/*
f().then(polygons => {
  let viz = new DistrictViz(polygons,2)
  for (const [district, obj] of Object.entries(polygons)) {
    obj['polygon'].on('click', () => viz.onClick(district))
    obj['polygon'].on('mouseover', () => viz.onHover(district))
  }
});
RadarChart.defaultConfig.color = (i) => {return ['red','blue', 'orange'][i]}
RadarChart.defaultConfig.radius = 3;
RadarChart.defaultConfig.w = 300;
RadarChart.defaultConfig.h = 300;

var district_data = null

let data = d3.csv("../data/district_comp.csv", function(d) {
  return {
    className: d['District.Name'], // convert "Year" column to Date
    axes : [
      {axis:'Life expectancy', value:d['life_exp']},
      {axis:'Population', value:d['pop']},
      {axis:'Births/hab', value:d['births_per']},
      {axis:'Unemployment score', value:d['unemployed_score']},
      {axis:'Deaths score (higher is better)', value:d['deaths_score']},
  ]
  };
}, function(error, data) {
    district_data = data
  });
*/

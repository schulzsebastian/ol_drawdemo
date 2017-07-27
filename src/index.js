// Hardcoded data, css and modules
import {polygon as default_range} from './data'
import css from './style.css'
import ol from 'openlayers'
import turf from 'turf'
import meta from 'turf-meta'
// Displayed layer style
const polygonStyle = f => {
    return new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255,255,255,0.4)'
        }),
        stroke: new ol.style.Stroke({
            color: '#3399CC',
            width: 1.25
        }),
        text: new ol.style.Text({
            text: f.get('label'),
            fill: new ol.style.Fill({
                color: 'rgba(255,0,0,1)'
            })
        })
    })
}
// View object
const view = new ol.View({
    center: ol.proj.fromLonLat([16.9, 52.4]),
    zoom: 14
})
// Source of displayed layer
const vector_source = new ol.source.Vector({
    features: (new ol.format.GeoJSON()).readFeatures(default_range, {
        featureProjection: 'EPSG:3857'
    }),
    wrapX: false
})
// Range updated with new features
const range = new ol.source.Vector({
    features: (new ol.format.GeoJSON()).readFeatures(default_range, {
        featureProjection: 'EPSG:3857'
    }),
    wrapX: false
})
// Displayed layer
const vector = new ol.layer.Vector({
    source: vector_source,
    style: polygonStyle
})
// Layerstack
const layers = [
    new ol.layer.Tile({
        source: new ol.source.OSM()
    }),
    vector
]
// Map object
const map = new ol.Map({
    target: 'map',
    layers: layers,
    view: view
})
// Draw interaction
const draw = new ol.interaction.Draw({
    source: vector_source,
    type: 'Polygon'
})
// Modify interaction
const select = new ol.interaction.Select({
    wrapX: false
})
const modify = new ol.interaction.Modify({
    features: select.getFeatures()
})
// Toggle for capture fixed geom
let fixing = false
const fixGeom = feature => {
    // Created feature
    let created = JSON.parse((new ol.format.GeoJSON()).writeFeature(feature, {
        featureProjection : 'EPSG:3857'
    }))
    // Create range to clip
    let layer 
    for(let f of range.getFeatures()) {
        let f_obj = JSON.parse((new ol.format.GeoJSON()).writeFeature(f, {
            featureProjection : 'EPSG:3857'
        }))
        if(!layer) layer = f_obj
        else layer = turf.union(layer, f_obj)
    }
    let diff_json = turf.buffer(turf.difference(created, layer), 0)
    diff_json.properties['label'] = `Obszar ${vector_source.getFeatures().length + 1}`
    let diff = (new ol.format.GeoJSON()).readFeature(diff_json, {
        featureProjection: 'EPSG:3857'
    })
    // Add clipped feature to displayed layer
    vector_source.addFeature(diff)
    // Add clipped feature to range
    range.addFeature(diff)
    fixing = false
}
// Draw events
draw.on('drawstart', e => fixing = true)
draw.on('drawend', e => {
    fixGeom(e.feature)
})
// Modify events
let edited_feature
select.on('select', e => {
    if(e.selected.length) edited_feature = e.selected[0]
    else {
        //TODO: Topology control
    }
})
// Remove hand-writed feature
vector_source.on('addfeature', e => {
    if(!fixing) {
        vector_source.removeFeature(e.feature)
    }
})
// Snapping
const snap = new ol.interaction.Snap({
    source: vector.getSource()
})
// Menu interaction
const addInteraction = mode => {
    if(mode == 'draw') {
        map.addInteraction(draw)
        map.addInteraction(snap)
        map.removeInteraction(select)
        map.removeInteraction(modify)
    } else if(mode == 'edit') {
        map.addInteraction(select)
        map.addInteraction(modify)
        map.addInteraction(snap)
        map.removeInteraction(draw)
    }
}
// Link functions to radio
for(let radio of document.getElementsByName('mode')) {
    radio.onclick = () => addInteraction(radio.value)
    if(radio.checked) addInteraction(radio.value)
}



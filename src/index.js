// Hardcoded data, css and modules
import {polygon as default_range} from './data'
import css from './style.css'
import ol from 'openlayers'
import turf from 'turf'
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
    source: vector_source
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
map.addInteraction(draw)
// Toggle for capture fixed geom
let drawing = false
// Draw event
draw.on('drawend', e => {
    drawing = true
    // Created feature
    let feature = JSON.parse((new ol.format.GeoJSON()).writeFeature(e.feature, {
        featureProjection : 'EPSG:3857'
    }))
    // Create range to clip
    let layer 
    for(let f of range.getFeatures()) {
        let geojson = new ol.format.GeoJSON()
        if(!layer) {
            layer = JSON.parse(geojson.writeFeature(f, {
                featureProjection : 'EPSG:3857'
            }))
        }
        else {
            layer = turf.union(layer, JSON.parse(geojson.writeFeature(f, {
                featureProjection : 'EPSG:3857'
            })))
        }
    }
    // Add clipped feature to displayed layer
    vector_source.addFeature((new ol.format.GeoJSON()).readFeature(turf.difference(feature, layer), {
        featureProjection: 'EPSG:3857'
    }))
    // Add clipped feature to range
    range.addFeature((new ol.format.GeoJSON()).readFeature(turf.difference(feature, layer), {
        featureProjection: 'EPSG:3857'
    }))
    drawing = false
})
// Remove hand-writed feature
vector_source.on('addfeature', e => {
    if(!drawing) {
        vector_source.removeFeature(e.feature)
    }
})
// Snapping
const snap = new ol.interaction.Snap({
    source: vector.getSource()
});
map.addInteraction(snap)



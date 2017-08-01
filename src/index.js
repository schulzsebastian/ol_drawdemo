// Hardcoded data, css and modules
import {polygon as default_range} from './data'
import ol from 'openlayers'
import turf from 'turf'
import turf_circle from 'turf-circle'
import Vue from 'vue'
import './modals'
import './style.css'

const vm = new Vue({
    el: '#app',
    data: {
        addModal: false,
        addButton: true,
        removeButton: false,
        donutModal: false,
        donutButton: true,
        layers: [],
        mapInteractions: [],
        currentFeature: {},
        edit: 'trim',
    },
    computed: {
        layersSource: function() {
            let features = this.layers.map(layer => layer.getSource().getFeatures()[0])
            return new ol.source.Vector({
                features: features
            })
        }
    },
    methods: {
        polygonStyle: function(f){
            return new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255,255,255,0.4)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#3399CC',
                    width: 1.25
                }),
                text: new ol.style.Text({
                    text: f.get('name'),
                    fill: new ol.style.Fill({
                        color: 'rgba(255,0,0,1)'
                    })
                })
            })
        },
        changeInteraction: function(interaction) {
            for(let interaction of this.mapInteractions) this.map.removeInteraction(interaction)
            this.mapInteractions = []
            if(interaction == 'add') {
                let draw = new ol.interaction.Draw({
                    source: new ol.source.Vector(),
                    type: 'Polygon'
                })
                draw.on('drawend', e => this.openModal('add', e.feature))
                this.map.addInteraction(draw)
                this.mapInteractions.push(draw)
                let snap = new ol.interaction.Snap({
                    source: this.layersSource
                })
                this.map.addInteraction(snap)
                this.mapInteractions.push(snap)
            } else if(interaction == 'select') {
                let select = new ol.interaction.Select({
                    layers: this.layers,
                    toggleCondition: ol.events.condition.never
                })
                select.on('select', e => this.selectFeature(e.selected[0]))
                this.map.addInteraction(select)
                this.mapInteractions.push(select)
            } else if(interaction == 'donut') {
                let donut = new ol.interaction.Draw({
                    source: new ol.source.Vector(),
                    type: 'Point'
                })
                donut.on('drawend', e => this.openModal('donut', e.feature))
                this.map.addInteraction(donut)
                this.mapInteractions.push(donut)
                let snap = new ol.interaction.Snap({
                    source: this.layersSource
                })
                this.map.addInteraction(snap)
                this.mapInteractions.push(snap)
            }
        },
        deleteFeature: function() {
            this.mapInteractions[0].getFeatures().clear()
            let id = this.currentFeature.id
            let layer = this.layers.filter(lyr => lyr.get('id') === id)[0]
            this.map.removeLayer(layer)
            this.layers = this.layers.filter(lyr => lyr.get('id') !== id)
            this.removeButton = false
        },
        selectFeature: function(selected) {
            if(selected) {
                this.currentFeature = {
                    feature: selected,
                    id: selected.get('id')
                }
                this.removeButton = true
            } else {
                this.currentFeature = {}
                this.removeButton = false
            }
        },
        startDonut: function() {
            this.donutButton = false
            this.changeInteraction('donut')
        },
        startAdd: function() {
            this.addButton = false
            this.changeInteraction('add')
        },
        openModal: function(modal, feature) {
            this.currentFeature = {
                feature: feature,
                id: this.layers.length + 1,
                layers: this.layers
            }
            if(modal == 'add') this.addModal = true
            if(modal == 'donut') this.donutModal = true
        },
        saveDonut: function(data) {
            this.donutModal = false
            this.donutButton = true
            this.currentFeature = {}
            this.changeInteraction('select')
            if(data == null) return
            let created_obj = JSON.parse((new ol.format.GeoJSON()).writeFeature(data.feature, {
                featureProjection : 'EPSG:3857'
            }))
            let bigger = turf_circle(created_obj, data.to, 64, 'kilometres')
            let smaller = turf_circle(created_obj, data.from, 64, 'kilometres')
            let diff_obj = turf.difference(bigger, smaller)
            let diff_fixed = turf.buffer(diff_obj, 0)
            let diff_feature = (new ol.format.GeoJSON()).readFeature(diff_fixed, {
                featureProjection: 'EPSG:3857'
            })
            diff_feature.setProperties({
                'id': data.id,
                'name': data.name
            })
            let source = new ol.source.Vector({
                features: [diff_feature]
            })
            let layer = new ol.layer.Vector({
                source: source,
                style: this.polygonStyle
            }) 
            this.addLayer(layer)
        },
        savePolygon: function(data) {
            this.addModal = false
            this.addButton = true
            this.currentFeature = {}
            this.changeInteraction('select')
            if(data == null) return
            let feature = data.feature
            feature.setProperties({
                'id': data.id,
                'name': data.name
            })
            let source = new ol.source.Vector({
                features: [feature]
            })
            let layer = new ol.layer.Vector({
                source: source,
                style: this.polygonStyle
            })
            layer.set('id', data.id)
            this.addLayer(layer)
        },
        addLayer: function(layer) {
            let created_obj = JSON.parse((new ol.format.GeoJSON()).writeFeature(layer.getSource().getFeatures()[0], {
                featureProjection : 'EPSG:3857'
            }))
            let range
            for(let lyr of this.layers) {
                let feature = lyr.getSource().getFeatures()[0]
                let f_obj = JSON.parse((new ol.format.GeoJSON()).writeFeature(feature, {
                    featureProjection : 'EPSG:3857'
                }))
                if(!range) range = f_obj
                else range = turf.union(range, f_obj)
            }
            if(range && turf.intersect(created_obj, range)) {
                let diff_obj = turf.difference(created_obj, range)
                if(!diff_obj) {
                    // Przypadek w którym stworzony poligon zawiera się w całości w istniejącym
                    alert('Niepoprawna geometria')
                    return
                }
                let diff_fixed = turf.buffer(diff_obj, 0)
                let diff_geom = (new ol.format.GeoJSON()).readFeature(diff_fixed, {
                    featureProjection: 'EPSG:3857'
                }).getGeometry()
                layer.getSource().getFeatures()[0].setGeometry(diff_geom)
            }
            this.map.addLayer(layer)
            this.layers.push(layer)
        }
    },
    mounted: function() {
        this.map = new ol.Map({
            target: 'map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([16.9, 52.4]),
                zoom: 14
            })
        })
    }
})
window.vm = vm
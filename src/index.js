// Hardcoded data, css and modules
import {polygon} from './data'
import ol from 'openlayers'
import turf from 'turf'
import turf_circle from 'turf-circle'
import Vue from 'vue'
import VueHighlightJS from 'vue-highlightjs'
import './modals'
import './style.css'
import 'highlight.js/styles/default.css'

Vue.use(VueHighlightJS)

const vm = new Vue({
    el: '#app',
    data: {
        addModal: false,
        donutModal: false,
        bufferModal: false,
        addButton: true,
        removeButton: true,
        editButton: true,
        saveButton: true,
        cancelButton: true,
        layers: [],
        mapInteractions: [],
        currentFeature: {},
        addMode: 'buffer',
        editMode: 'trim',
        editTool: 'vertex',
        edit: false,
        request: {
            type: 'FeatureCollection',
            features: []
        }
    },
    computed: {
        layersSource: function() {
            let features = this.layers.map(layer => layer.getSource().getFeatures()[0])
            return new ol.source.Vector({
                features: features
            })
        },
        rangeObj: function() {
            let range
            for(let lyr of this.layers) {
                let feature = lyr.getSource().getFeatures()[0]
                let f_obj = JSON.parse((new ol.format.GeoJSON()).writeFeature(feature, {
                    featureProjection : 'EPSG:3857'
                }))
                if(!range) range = f_obj
                else range = turf.union(range, f_obj)
            }
            return range
        },
        geojsonRequest: function() {
            return JSON.stringify(this.request, null, 2)
        }
    },
    watch: {
        editTool: function() {
            this.changeInteraction('edit')
        },
        addMode: function() {
            this.changeInteraction(this.addMode)
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
                    text: f.get('externalId'),
                    fill: new ol.style.Fill({
                        color: 'rgba(255,0,0,1)'
                    })
                })
            })
        },
        circleStyle: function(f){
            return new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255,255,255,0.4)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#3399CC',
                    width: 1.25
                }),
                text: new ol.style.Text({
                    text: f.get('externalId'),
                    fill: new ol.style.Fill({
                        color: 'rgba(255,0,0,1)'
                    }),
                    textAlign: 'right',
                })
            })
        },
        modifyStyle: function(f) {
            let fill = new ol.style.Fill({
                color: 'rgba(255,255,255,0.4)'
            })
            let stroke = new ol.style.Stroke({
                color: '#ff4d4d',
                width: 1.25
            })
            return new ol.style.Style({
                fill: fill,
                stroke: stroke,
                image: new ol.style.Circle({
                    fill: fill,
                    stroke: stroke,
                    radius: 5
                })
            })
        },
        changeButtonState: function(interaction) {
            switch(interaction) {
                case 'select':
                    this.addButton = true
                    this.removeButton = false
                    this.editButton = false
                    this.saveButton = false
                    this.cancelButton = false
                    this.edit = false
                    break
                case 'selected':
                    this.removeButton = true
                    this.editButton = true
                    this.saveButton = false
                    this.addButton = false
                    this.cancelButton = false
                    this.edit = false
                    break
                case 'add':
                case 'donut':
                case 'buffer':
                    this.addButton = false
                    this.saveButton = false
                    this.removeButton = false
                    this.editButton = false
                    this.cancelButton = false
                    this.edit = false
                    break
                case 'edit':
                    this.saveButton = true
                    this.cancelButton = true
                    this.edit = true
                    this.addButton = false
                    this.removeButton = false
                    this.editButton = false
                    break
            }
        },
        changeInteraction: function(interaction) {
            for(let interaction of this.mapInteractions) this.map.removeInteraction(interaction)
            this.mapInteractions = []
            this.changeButtonState(interaction)
            switch(interaction) {
                case 'add':
                    let draw = new ol.interaction.Draw({
                        source: new ol.source.Vector(),
                        type: 'Polygon'
                    })
                    draw.on('drawend', e => this.openModal('add', e.feature))
                    this.map.addInteraction(draw)
                    this.mapInteractions.push(draw)
                    let snap_add = new ol.interaction.Snap({
                        source: this.layersSource
                    })
                    this.map.addInteraction(snap_add)
                    this.mapInteractions.push(snap_add)
                    break
                case 'select':
                    let select = new ol.interaction.Select({
                        layers: this.layers,
                        toggleCondition: ol.events.condition.never
                    })
                    select.on('select', e => this.selectFeature(e.selected[0]))
                    this.map.addInteraction(select)
                    this.mapInteractions.push(select)
                    break
                case 'donut':
                    let donut = new ol.interaction.Draw({
                        source: new ol.source.Vector(),
                        type: 'Point'
                    })
                    donut.on('drawend', e => this.openModal('donut', e.feature))
                    this.map.addInteraction(donut)
                    this.mapInteractions.push(donut)
                    let snap_donut = new ol.interaction.Snap({
                        source: this.layersSource
                    })
                    this.map.addInteraction(snap_donut)
                    this.mapInteractions.push(snap_donut)
                    break
                case 'buffer':
                    let buffer = new ol.interaction.Draw({
                        source: new ol.source.Vector(),
                        type: 'Point'
                    })
                    buffer.on('drawend', e => this.openModal('buffer', e.feature))
                    this.map.addInteraction(buffer)
                    this.mapInteractions.push(buffer)
                    let snap_buffer = new ol.interaction.Snap({
                        source: this.layersSource
                    })
                    this.map.addInteraction(snap_buffer)
                    this.mapInteractions.push(snap_buffer)
                    break
                case 'edit':
                    if(this.editTool == 'vertex') {
                        let layer = this.layers.filter(lyr => lyr.get('id') == this.currentFeature.id)[0]
                        let select_edit = new ol.interaction.Select({
                            layers: [layer],
                            toggleCondition: ol.events.condition.never
                        })
                        select_edit.getFeatures().push(this.currentFeature.feature)
                        let modify = new ol.interaction.Modify({
                            features: select_edit.getFeatures(),
                            style: this.modifyStyle
                        })
                        layer.setStyle(this.modifyStyle())
                        this.map.addInteraction(modify)
                        this.mapInteractions.push(modify)
                        let snap_edit = new ol.interaction.Snap({
                            source: this.layersSource
                        })
                        this.map.addInteraction(snap_edit)
                        this.mapInteractions.push(snap_edit)
                    } else if(this.editTool == 'area') {
                        let layer = this.layers.filter(lyr => lyr.get('id') == this.currentFeature.id)[0]
                        layer.setStyle(this.modifyStyle())
                        let draw_edit = new ol.interaction.Draw({
                            source: new ol.source.Vector(),
                            type: 'Polygon'
                        })
                        draw_edit.on('drawend', e => this.editPolygon(e.feature))
                        this.map.addInteraction(draw_edit)
                        this.mapInteractions.push(draw_edit)
                        let snap_edit = new ol.interaction.Snap({
                            source: this.layersSource
                        })
                        this.map.addInteraction(snap_edit)
                        this.mapInteractions.push(snap_edit)
                        break
                    }
                    break
            }
        },
        removeLayer: function(id) {
            this.map.removeLayer(this.layers.filter(lyr => lyr.get('id') === id)[0])
            this.layers = this.layers.filter(lyr => lyr.get('id') !== id)
        },
        deleteFeature: function() {
            this.mapInteractions[0].getFeatures().clear()
            this.removeLayer(this.currentFeature.id)
            this.changeInteraction('select')
        },
        cancelModify: function() {
            let layer = this.layers.filter(lyr => lyr.get('id') === this.currentFeature.id)[0]
            let geom = (new ol.format.GeoJSON()).readFeature(this.currentFeature.geom, {
                featureProjection: 'EPSG:3857'
            }).getGeometry()
            layer.getSource().getFeatures()[0].setGeometry(geom)
            layer.setStyle(this.polygonStyle(layer.getSource().getFeatures()[0]))
            this.currentFeature = {}
            this.changeInteraction('select')
        },
        saveModify: function() {
            this.removeLayer(this.currentFeature.id)
            let source = new ol.source.Vector({
                features: [this.currentFeature.feature]
            })
            let layer = new ol.layer.Vector({
                source: source,
                style: this.polygonStyle
            })
            layer.set('id', this.currentFeature.id)
            this.currentFeature = {}
            this.addLayer(layer)
            this.changeInteraction('select')
            this.request.features = [JSON.parse((new ol.format.GeoJSON()).writeFeature(layer, {
                featureProjection : 'EPSG:3857'
            }))]
        },
        selectFeature: function(selected) {
            if(selected) {
                this.currentFeature = {
                    feature: selected,
                    id: selected.get('id'),
                    geom: JSON.parse((new ol.format.GeoJSON()).writeFeature(selected, {
                        featureProjection : 'EPSG:3857'
                    }))
                }
                this.changeButtonState('selected')
            } else {
                this.currentFeature = {}
                this.changeButtonState('select')     
            }
        },
        editPolygon: function(feature) {
            let created_obj = JSON.parse((new ol.format.GeoJSON()).writeFeature(feature, {
                featureProjection : 'EPSG:3857'
            }))
            let base = JSON.parse((new ol.format.GeoJSON()).writeFeature(this.currentFeature.feature, {
                featureProjection : 'EPSG:3857'
            }))
            let range = turf.difference(this.rangeObj, base)
            let diff
            if(range) {
                if(this.editMode == 'trim') {
                    diff = turf.buffer(turf.difference(turf.union(base, created_obj), range), 0)
                } else if(this.editMode == 'cut') {
                    this.request.features = []
                    for(let lyr of this.layers) {
                        let lyr_obj = JSON.parse((new ol.format.GeoJSON()).writeFeature(lyr.getSource().getFeatures()[0], {
                            featureProjection : 'EPSG:3857'
                        }))
                        if(turf.intersect(created_obj, lyr_obj)) {
                            let diff_obj = turf.difference(lyr_obj, created_obj)
                            if(!diff_obj) {
                                // Przypadek w którym stworzony poligon zawiera się w całości w istniejącym
                                alert('Niepoprawna geometria')
                                return
                            }
                            let diff_fixed = turf.buffer(diff_obj, 0)
                            let diff_geom = (new ol.format.GeoJSON()).readFeature(diff_fixed, {
                                featureProjection: 'EPSG:3857'
                            }).getGeometry()
                            lyr.getSource().getFeatures()[0].setGeometry(diff_geom)
                            this.request.features.push(JSON.parse((new ol.format.GeoJSON()).writeFeature(lyr.getSource().getFeatures()[0], {
                                featureProjection : 'EPSG:3857'
                            })))
                        }
                    }
                    diff = turf.union(base, created_obj)
                }
            }else {
                diff = turf.union(base, created_obj)
            }
            let union = (new ol.format.GeoJSON()).readFeature(diff, {
                featureProjection: 'EPSG:3857'
            })
            this.currentFeature.feature.setGeometry(union.getGeometry())
            this.request.features = [JSON.parse((new ol.format.GeoJSON()).writeFeature(union, {
                featureProjection : 'EPSG:3857'
            }))]
        },
        openModal: function(modal, feature) {
            this.currentFeature = {
                feature: feature,
                id: this.layers.length + 1,
                layers: this.layers
            }
            if(modal == 'add') this.addModal = true
            if(modal == 'donut') this.donutModal = true
            if(modal == 'buffer') this.bufferModal = true
        },
        saveDonut: function(data) {
            this.donutModal = false
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
                'externalId': data.externalId
            })
            let source = new ol.source.Vector({
                features: [diff_feature]
            })
            let layer = new ol.layer.Vector({
                source: source,
                style: this.polygonStyle
            }) 
            layer.set('id', data.id)
            this.addLayer(layer)
        },
        saveBuffer: function(data) {
            this.bufferModal = false
            this.currentFeature = {}
            this.changeInteraction('select')
            if(data == null) return
            let center = JSON.parse((new ol.format.GeoJSON()).writeFeature(data.feature, {
                featureProjection : 'EPSG:3857'
            }))
            let circles = []
            for(let range of data.ranges) {
                // desc
                circles.push(turf_circle(center, range, 64, 'kilometres'))
            }
            for(let i = 0; i<circles.length - 1; i++) {
                circles[i] = turf.buffer(turf.difference(circles[i], circles[i+1]), 0)
            }
            for(let circle of circles) {
                let feature = (new ol.format.GeoJSON()).readFeature(circle, {
                    featureProjection: 'EPSG:3857'
                })
                feature.setProperties({
                    'id': data.id.toString(),
                    'externalId': data.externalId.toString()
                })
                let source = new ol.source.Vector({
                    features: [feature]
                })
                let layer = new ol.layer.Vector({
                    source: source,
                    style: this.circleStyle
                }) 
                layer.set('id', data.id)
                data.id += 1
                data.externalId += 1
                this.addLayer(layer)
            }
        },
        savePolygon: function(data) {
            this.addModal = false
            this.currentFeature = {}
            this.changeInteraction('select')
            if(data == null) return
            let feature = data.feature
            feature.setProperties({
                'id': data.id,
                'externalId': data.externalId
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
            if(this.editMode == 'trim') {
                // intersect TypeError: this.seg.p1.equals2D is not a function
                if(this.rangeObj && turf.intersect(created_obj, this.rangeObj)) {
                    let diff_obj = turf.difference(created_obj, this.rangeObj)
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
                this.request.features = [JSON.parse((new ol.format.GeoJSON()).writeFeature(layer.getSource().getFeatures()[0], {
                    featureProjection : 'EPSG:3857'
                }))]
                this.map.addLayer(layer)
                this.layers.push(layer)
            } else if(this.editMode == 'cut') {
                this.request.features = []
                for(let lyr of this.layers) {
                    let lyr_obj = JSON.parse((new ol.format.GeoJSON()).writeFeature(lyr.getSource().getFeatures()[0], {
                        featureProjection : 'EPSG:3857'
                    }))
                    if(this.rangeObj && turf.intersect(created_obj, lyr_obj)) {
                        let diff_obj = turf.difference(lyr_obj, created_obj)
                        if(!diff_obj) {
                            // Przypadek w którym stworzony poligon zawiera się w całości w istniejącym
                            alert('Niepoprawna geometria')
                            return
                        }
                        let diff_fixed = turf.buffer(diff_obj, 0)
                        let diff_geom = (new ol.format.GeoJSON()).readFeature(diff_fixed, {
                            featureProjection: 'EPSG:3857'
                        }).getGeometry()
                        lyr.getSource().getFeatures()[0].setGeometry(diff_geom)
                        this.request.features.push(JSON.parse((new ol.format.GeoJSON()).writeFeature(lyr.getSource().getFeatures()[0], {
                            featureProjection : 'EPSG:3857'
                        })))
                    }
                }
                this.request.features.push(JSON.parse((new ol.format.GeoJSON()).writeFeature(layer.getSource().getFeatures()[0], {
                    featureProjection : 'EPSG:3857'
                })))
                this.map.addLayer(layer)
                this.layers.push(layer)
            }
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
        let feature = {
            feature: (new ol.format.GeoJSON()).readFeature(polygon, {
                featureProjection: 'EPSG:3857'
            }),
            id: "1",
            externalId: "effe71"
        }
        this.savePolygon(feature)
    }
})
window.vm = vm
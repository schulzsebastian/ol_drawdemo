import Vue from 'vue'
import 'jquery'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'

Vue.component('add-modal', {
    props: ['id', 'data'],
    data : function() {
        return {
            id_feature: '',
            externalId: '',
            layers: []
        }
    },
    template: `
    <div v-bind:id="id" class="modal fade" data-backdrop="static">
    <div class="modal-dialog">
        <div class="modal-content">
        <div class="modal-header">
            <a class="close" v-on:click="forceClose">×</a>
            <h4>Nowy obszar</h4>
        </div>
        <div class="modal-body">
            <div class="form-group">
            <label for="example-text-input" class="col-2 col-form-label">ID</label>
            <div class="col-10">
                <input class="form-control" type="text" id="example-text-input" v-model="id_feature">
            </div>
            </div>
            <div class="form-group">
            <label for="example-search-input" class="col-2 col-form-label">Nazwa</label>
            <div class="col-10">
                <input class="form-control" type="text" id="example-search-input" v-model="externalId">
            </div>
            </div>
        </div>
        <div class="modal-footer">
            <a class="btn btn-default" v-on:click="closeModal">Ok</a>
        </div>
        </div>
    </div>
    </div>`,
    methods: {
        forceClose: function() {
            $('#'+this.id).modal('hide')
            this.$emit('close-modal', null)
        },
        closeModal: function(){
            if(this.validateId(this.id_feature)) {
                $('#'+this.id).modal('hide')
                let feature = {
                    feature: this.data.feature,
                    id: this.id_feature,
                    externalId: this.externalId
                }
                this.$emit('close-modal', feature)
            } else {
                alert('Id już istnieje')
            }
        },
        validateId: function(id){
            for(let layer of this.layers) {
                if(layer.get('id') == id) {
                    return false
                }
            }
            return true
        }
    },
    mounted: function(){
        this.id_feature = this.data.id
        this.externalId = `effe7${this.data.id}`
        this.layers = this.data.layers
        $('#'+this.id).modal('show')
        $('#'+this.id).attr('class', 'modal')
    }
})

Vue.component('donut-modal', {
    props: ['id', 'data'],
    data : function() {
        return {
            id_feature: '',
            layers: [],
            from: 2,
            to: 3,
            externalId: ''
        }
    },
    template: `
    <div v-bind:id="id" class="modal fade" data-backdrop="static">
    <div class="modal-dialog">
        <div class="modal-content">
        <div class="modal-header">
            <a class="close" v-on:click="forceClose">×</a>
            <h4>Nowy donut</h4>
        </div>
        <div class="modal-body">
        <div class="form-group">
            <label for="example-text-input" class="col-2 col-form-label">ID</label>
            <div class="col-10">
                <input class="form-control" type="text" id="example-text-input" v-model="id_feature">
            </div>
        </div>
        <div class="form-group">
            <label for="example-text-input" class="col-2 col-form-label">Nazwa</label>
            <div class="col-10">
                <input class="form-control" type="text" id="example-text-input" v-model="externalId">
            </div>
        </div>
        <div class="form-group">
            <label for="example-text-input" class="col-2 col-form-label">Od (w km)</label>
            <div class="col-10">
                <input class="form-control" type="number" id="example-text-input" v-model="from">
            </div>
        </div>
        <div class="form-group">
            <label for="example-text-input" class="col-2 col-form-label">Do (w km)</label>
            <div class="col-10">
                <input class="form-control" type="number" id="example-text-input" v-model="to">
            </div>
        </div>
        </div>
        <div class="modal-footer">
            <a class="btn btn-default" v-on:click="closeModal">Ok</a>
        </div>
        </div>
    </div>
    </div>`,
    methods: {
        forceClose: function() {
            $('#'+this.id).modal('hide')
            this.$emit('close-modal', null)
        },
        closeModal: function(){
            if(this.validateId(this.id_feature)) {
                $('#'+this.id).modal('hide')
                let feature = {
                    feature: this.data.feature,
                    from: this.from,
                    to: this.to,
                    id: this.id_feature,
                    externalId: this.externalId
                }
                this.$emit('close-modal', feature)
            } else {
                alert('Id już istnieje')
            }
        },
        validateId: function(id){
            for(let layer of this.layers) {
                if(layer.get('id') == id) {
                    return false
                }
            }
            return true
        }
    },
    mounted: function(){
        this.id_feature = this.data.id
        this.externalId = `efef7${this.data.id}`
        this.layers = this.data.layers
        $('#'+this.id).modal('show')
        $('#'+this.id).attr('class', 'modal')
    }
})


Vue.component('buffer-modal', {
    props: ['id', 'data'],
    data : function() {
        return {
            id_feature: '',
            externalId: '',
            layers: [],
            qranges: 0,
            ranges: []
        }
    },
    watch: {
        qranges: function() {
            this.ranges = []
            for(let i=1; i<=this.qranges; i++) {
                this.ranges.push({
                    val: i
                })
            }
        }
    },
    template: `
    <div v-bind:id="id" class="modal fade" data-backdrop="static">
    <div class="modal-dialog">
        <div class="modal-content">
        <div class="modal-header">
            <a class="close" v-on:click="forceClose">×</a>
            <h4>Nowe zasięgi</h4>
        </div>
        <div class="modal-body">
        <div class="form-group">
            <label for="example-text-input" class="col-2 col-form-label">ID</label>
            <div class="col-10">
                <input class="form-control" type="text" id="example-text-input" v-model="id_feature">
            </div>
        </div>
        <div class="form-group">
            <label for="example-text-input" class="col-2 col-form-label">Nazwa</label>
            <div class="col-10">
                <input class="form-control" type="text" id="example-text-input" v-model="externalId">
            </div>
        </div>
        <div class="form-group">
            <label for="example-text-input" class="col-2 col-form-label">Ilość zasięgów</label>
            <div class="col-10">
                <input class="form-control" type="number" id="example-text-input" v-model="qranges">
            </div>
        </div>
        <hr/>
        <div class="form-group" v-for="(item, idx) in ranges">
            <label for="example-text-input" class="col-2 col-form-label" v-text="'Zasięg ' + (idx + 1)"></label>
            <div class="col-10">
                <input class="form-control" type="number" id="example-text-input" v-model="item.val">
            </div>
        </div>
        </div>
        <div class="modal-footer">
            <a class="btn btn-default" v-on:click="closeModal">Ok</a>
        </div>
        </div>
    </div>
    </div>`,
    methods: {
        forceClose: function() {
            $('#'+this.id).modal('hide')
            this.$emit('close-modal', null)
        },
        closeModal: function(){
            if(this.validateId(this.id_feature)) {
                if(this.validate) {
                    $('#'+this.id).modal('hide')
                    let feature = {
                        feature: this.data.feature,
                        ranges: this.ranges.map(x => x.val).sort().reverse(),
                        id: this.id_feature,
                        externalId: this.externalId
                    }
                    this.$emit('close-modal', feature)
                } else {
                    alert('Niepoprawne zasięgi')
                }
            } else {
                alert('Id już istnieje')
            }
        },
        validateId: function(id){
            for(let layer of this.layers) {
                if(layer.get('id') == id) {
                    return false
                }
            }
            return true
        },
        validate: function() {
            if(this.qranges < 1) return false
            if((new Set(this.ranges.map(x => x.val))).size !== this.ranges.length) return false
            if(this.range.filter(x => x.val < 1)) return false
            return true
        }
    },
    mounted: function(){
        this.qranges = 3
        this.id_feature = this.data.id
        this.externalId = 1441
        this.layers = this.data.layers
        $('#'+this.id).modal('show')
        $('#'+this.id).attr('class', 'modal')
    }
})
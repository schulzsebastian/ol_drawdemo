import Vue from 'vue'
import 'jquery'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'

Vue.component('modal', {
    props: ['id', 'data'],
    data : function() {
        return {
            id_feature: '',
            name: ''
        }
    },
    template: `
    <div v-bind:id="id" class="modal fade" data-backdrop="static">
    <div class="modal-dialog">
        <div class="modal-content">
        <div class="modal-header">
            <a class="close" v-on:click="closeModal">×</a>
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
                <input class="form-control" type="text" id="example-search-input" v-model="name">
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
        closeModal: function(){
            if(this.validateId(this.id_feature)) {
                $('#'+this.id).modal('hide')
                let feature = {
                    feature: this.data.feature,
                    id: this.id_feature,
                    name: this.name
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
        this.name = `Obszar ${this.data.id}`
        this.layers = this.data.layers
        $('#'+this.id).modal('show')
        $('#'+this.id).attr('class', 'modal')
    }
})
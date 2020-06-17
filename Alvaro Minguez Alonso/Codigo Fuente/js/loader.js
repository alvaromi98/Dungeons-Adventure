//clase que carga los archivos especificados

const Loader = function() {
    this.tile_set_image = undefined;
}

Loader.prototype = {
    constructor: Game.Loader,

    //rqJSON carga el fichero json de la url indicada, una vez cargado llama a la funcion callback especificada
    rqJSON: function(url, funcion) {
        var peticion = new XMLHttpRequest();
        peticion.addEventListener("load", function() {
            funcion(JSON.parse(this.responseText));
        }, {
            once: true,
        })
        peticion.open("GET", url);
        peticion.send();
    },

    //rqTileImage carga la image de los tiles según la url indicada, una vez cargada llama a la funcion callback especificada
    rqTileImage: function(url, funcion) {
        let imagen = new Image();
        imagen.addEventListener("load", function() {
            funcion(imagen);
        }, { once: true })
        imagen.src = url;
    }
}
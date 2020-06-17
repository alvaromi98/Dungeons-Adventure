const Display = function(canvas) {
    this.buffer = document.createElement("canvas").getContext("2d");
    this.context = canvas.getContext("2d");
    this.volver = document.createElement("button");
    //MENU SUPERIOR
    this.volver.innerHTML = "Volver";
    this.volver.className = "btn btn-info col";
    this.volver.id = "volver";
    this.volver.setAttribute("onClick", "window.location.reload();");
    this.menu = document.createElement("section");
    this.menu.className = "container-fluid justify-content-center";
    this.menu.setAttribute("style", "overflow: hidden !important;  margin:0");
    this.row = document.createElement("article");
    this.row.className = "row";
    this.row2 = document.createElement("article");
    this.row2.className = "row";
    this.row.setAttribute("style", "overflow: hidden;");
    //carteles
    this.cartelvidas = document.createElement("button");
    this.cartelvidas.className = "btn col text-white col";
    this.monedasrestantes = document.createElement("button");
    this.monedasrestantes.className = "btn col text-white col";
    document.body.appendChild(this.menu);
    this.menu.appendChild(this.row);
    this.menu.appendChild(this.row2);
    this.row.appendChild(this.cartelvidas);
    this.row.appendChild(this.volver);
    this.row.appendChild(this.monedasrestantes);
    this.row2.appendChild(canvas);


    //funcion de dibujar un mapa, recorremos el array y por cada valor seteamos el origena recortar y el destino, después lo dibujamos con dibujarImagen()
    this.dibujaMapa = function(img, img_col, mapa, m_col, tile_size) {
            for (let i = mapa.length - 1; i > -1; --i) {
                //recogemos el valor 
                var tile = mapa[i];
                //recogemos el tile
                var origen_x = (tile % img_col) * tile_size;
                var origen_y = Math.floor(tile / img_col) * tile_size;
                //posicion donde vamos a dibujar el tile
                var destino_x = (i % m_col) * tile_size;
                var destino_y = Math.floor(i / m_col) * tile_size;
                //pintamos la tile en el buffer 
                this.buffer.drawImage(img, origen_x, origen_y, tile_size, tile_size, destino_x, destino_y, tile_size, tile_size);
            }

        }
        //funcion de dibujar el personaje 
    this.dibujaObjeto = function(img, origen_x, origen_y, destino_x, destino_y, width, height) {

        this.buffer.drawImage(img, origen_x, origen_y, width, height, Math.round(destino_x), Math.round(destino_y), width, height);
    }

    this.resize = function(width, height, ratio) {
            //para que se reescale correctamente tenemos que comprobar que el ratio de altura : anchura sea el mismo
            if (height / width > ratio) {
                this.context.canvas.height = width * ratio;
                this.context.canvas.width = width;

            } else {
                this.context.canvas.height = height;
                this.context.canvas.width = height / ratio;
            }
            //para que se vean bien en pixel art y no aparezca borroso tras escalado los pixeles
            this.context.imageSmoothingEnabled = false;

        }
        //funcion que dibuja la pantalla de gameover
    this.gameOver = function(img) {
        this.context.drawImage(img, 0, 0, this.buffer.canvas.width, this.buffer.canvas.height, 0, 0, this.context.canvas.width, this.context.canvas.height);
    }
}

Display.prototype = {
    constructor: Display,
    render: function() {
        this.context.drawImage(this.buffer.canvas, 0, 0, this.buffer.canvas.width, this.buffer.canvas.height, 0, 0, this.context.canvas.width, this.context.canvas.height);
    }
}
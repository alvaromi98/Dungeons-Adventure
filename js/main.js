function start() {

    //quitamos el header y el body para dar espacio al canvas
    document.getElementById("header").remove();
    document.getElementById("main").remove();
    var elem = document.getElementsByTagName("footer")[0];
    elem.parentNode.removeChild(elem);

    var keyDownUp = function(event) {
            controller.keyDownUp(event.type, event.keyCode);
        }
        //reescalado
    var resize = function() {

            display.resize(document.documentElement.clientWidth, document.documentElement.clientHeight, game.world.height / game.world.width);
            display.render();

        }
        //renderizado
    var render = function() {
            //dibujamos el mapa
            display.dibujaMapa(loader.tile_set_image, game.world.tile_set.columnas, game.world.mapa, game.world.columnas, game.world.tile_set.tile_size);
            //recogemos los frames para la animacion
            let frame_personaje = game.world.tile_set.array_frames[game.world.personaje.f_value];
            //dibujamos el personaje con los frames y la posicion correspondientes
            display.dibujaObjeto(loader.tile_set_image, frame_personaje.x, frame_personaje.y, game.world.personaje.x, game.world.personaje.y, frame_personaje.width, frame_personaje.height);
            for (let i = 0; i < game.world.coins.length; i++) {
                let coin = game.world.coins[i];
                let framecoin = game.world.tile_set.array_frames[coin.f_value];
                display.dibujaObjeto(loader.tile_set_image, framecoin.x, framecoin.y, coin.x, coin.y, framecoin.width, framecoin.height);
            }
            for (let k = 0; k < game.world.spikes.length; k++) {
                let sierra = game.world.spikes[k];
                let f = game.world.tile_set.array_frames[sierra.f_value];
                display.dibujaObjeto(loader.tile_set_image, f.x, f.y, sierra.x, sierra.y, f.width, f.height);
            }
            for (let k = 0; k < game.world.blocks.length; k++) {
                let block = game.world.blocks[k];
                let f = game.world.tile_set.array_frames[block.f_value];
                display.dibujaObjeto(loader.tile_set_image, f.x, f.y, block.x, block.y, f.width, f.height);
            }
            for (let k = 0; k < game.world.platforms.length; k++) {
                let platform = game.world.platforms[k];
                let f = game.world.tile_set.array_frames[platform.f_value];
                display.dibujaObjeto(loader.tile_set_image, f.x, f.y, platform.x, platform.y, f.width, f.height);
            }
            display.render();
        }
        //update, setea el movimiento del personaje al que es dependiendo de que tecla hayamos pulsado
    var update = function() {
        if (controller.izq.active) {
            game.world.personaje.moverIzq();
        }
        if (controller.dcha.active) {
            game.world.personaje.moverDcha();
        }
        if (controller.saltar.active) {
            game.world.personaje.saltar();
            controller.saltar.active = false;
        }
        if (game.world.personaje.vidas < 0) {
            loader.rqTileImage("img/gameover.png", (imagen) => {
                display.gameOver(imagen);
                engine.stop();
            })
        }

        //añadimos el cartel de  vidas restantes
        if (game.world.personaje.vidas >= -1) {
            display.cartelvidas.innerHTML = "Vidas restantes: " + "&#10084;".repeat(game.world.personaje.vidas + 1);
        }
        if (game.world.score >= -1) {
            display.monedasrestantes.innerHTML = "Monedas restantes: " + "<img src='img/coin.png' width='18px' height='18px'> ".repeat(game.world.score);
        }
        //ejecutamos todos los updates del script game.js (game.world.update el cual ejecuta el update de cada objeto)
        game.update();
        //si el personaje colisiona con una puerta inizializa la variable gate la cual indica que nivel cargar
        if (game.world.gate) {
            //paramos el juego
            engine.stop();
            //recogemos el nuevo nivel y lo cargamos
            loader.rqJSON("json/nivel" + game.world.gate.nivel_destino + ".json", (nivel) => {
                //cargamos el nivel
                game.world.cargarNivel(nivel);
                //iniciamos el juego de nuevo
                engine.start();

            });
            return;
        }

    }

    //inicializar los objetos
    var loader = new Loader();
    var controller = new Controller();
    var game = new Game();
    var display = new Display(document.querySelector("canvas"));
    var engine = new Engine(1000 / 30, render, update);

    //reescalado "manual"    
    display.buffer.canvas.height = game.world.height;
    display.buffer.canvas.width = game.world.width;
    display.buffer.imageSmoothingEnabled = false;

    //recuperamos el nivel
    loader.rqJSON("json/nivel" + game.world.id_nivel + ".json", (nivel) => {
        game.world.cargarNivel(nivel);
        //recogemos el tileset
        loader.rqTileImage("img/tiles.png", (imagen) => {
            loader.tile_set_image = imagen;
            resize();
            engine.start();
        })
    })


    window.addEventListener("keydown", keyDownUp);
    window.addEventListener("keyup", keyDownUp);
    window.addEventListener("keydown", function(e) {
        // space and arrow keys
        if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }, false)
    window.addEventListener("resize", resize);
};
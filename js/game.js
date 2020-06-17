const Game = function() {
    this.world = new Game.World();
    this.update = function() {
        this.world.update();
    }
}

Game.prototype = {
    constructor: Game
}


//////////////////////////////////////////////////////////OBJETO TILE SET/////////////////////////////////////////////////////////////////////
Game.TileSet = function(tile_size, columnas) {

    this.tile_size = tile_size;
    this.columnas = columnas;

    var frame = Game.Frame;
    this.array_frames = [
        //mirando derecha [0]
        new frame(196, 38, 21, 26),
        //moviendose dcha [1-6] el frame [4] equivale al salto derecha.
        new frame(166, 6, 21, 26), new frame(197, 6, 21, 26), new frame(229, 6, 21, 26), new frame(262, 6, 21, 26), new frame(294, 6, 21, 26), new frame(325, 6, 21, 26),
        //mirando izq [7]
        new frame(229, 38, 21, 26),
        //moviendose izq [8-14], frame [10] equivale al salto izquierda
        new frame(166, 38, 21, 26), new frame(134, 38, 21, 26), new frame(102, 38, 21, 26), new frame(70, 38, 21, 26), new frame(38, 38, 21, 26), new frame(6, 38, 21, 26),
        //monedas
        new frame(0, 64, 16, 16), new frame(16, 64, 16, 16), new frame(32, 64, 16, 16), new frame(48, 64, 16, 16),
        //spike
        new frame(37, 82, 13, 13), new frame(50, 82, 13, 13),
        //blocks
        new frame(64, 64, 32, 32), new frame(96, 64, 32, 32),
        //platforms
        new frame(196, 64, 32, 15)
    ];
}
Game.TileSet.prototype = { constructor: Game.TileSet };

//para definir los frames dentro de los arrays de tiles para cada animacion
Game.Frame = function(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}
Game.Frame.prototype = { constructor: Game.Frame };


////////////////////////////////////////////////////////OBJETO WORLD/////////////////////////////////////////////////////////////////////
Game.World = function(friccion = 0.15, gravedad = 2) {

    //variables de nivel
    this.id_nivel = "1";
    this.score = 0;

    //variables del mapa
    this.friccion = friccion;
    this.gravedad = gravedad;
    this.columnas = 36;
    this.filas = 17;

    //instanciacion de objetos
    this.tile_set = new Game.TileSet(32, 11);
    this.collider = new Game.Collider();
    this.personaje = new Game.Personaje(35, 440);

    //""reescalado""" 
    this.height = this.tile_set.tile_size * this.filas;
    this.width = this.tile_set.tile_size * this.columnas;
}

Game.World.prototype = {

    constructor: Game.World,
    //metodo para cargar niveles a partir de jsons
    cargarNivel: function(nivel) {
        this.mapa = nivel.mapa;
        this.columnas = nivel.columnas;
        this.filas = nivel.filas;
        this.gates = new Array();
        this.coins = new Array();
        this.spikes = new Array();
        this.blocks = new Array();
        this.platforms = new Array();
        this.score = nivel.coins.length + 1;
        this.id_nivel = nivel.id_nivel;
        this.personaje.setReaparicionX(nivel.reaparicion_x * this.tile_set.tile_size);
        this.personaje.setReaparicionX(nivel.reaparicion_x * this.tile_set.tile_size);
        this.personaje.setReaparicionY(nivel.reaparicion_y * this.tile_set.tile_size);
        //padding para centrar los objetos
        var padding = this.tile_set.tile_size / 4;


        //seteamos las monedas
        for (var j = nivel.coins.length - 1; j > -1; j--) {
            var moneda = nivel.coins[j];
            this.coins[j] = new Game.Coin(moneda[0] * this.tile_set.tile_size + padding, moneda[1] * this.tile_set.tile_size + padding + 4);
        }

        //seteamos las spike
        for (var k = nivel.spikes.length - 1; k > -1; k--) {
            var spike = nivel.spikes[k];
            this.spikes[k] = new Game.Spike(spike[0] * this.tile_set.tile_size - 7, spike[1] * this.tile_set.tile_size + padding + 1, spike[2], spike[3], spike[4], spike[5]);
        }

        //seteamos las plataformas
        for (var m = nivel.platforms.length - 1; m > -1; m--) {
            var plataforma = nivel.platforms[m];
            this.platforms[m] = new Game.Platform(plataforma[0] * this.tile_set.tile_size - 7, plataforma[1] * this.tile_set.tile_size + padding + 1, plataforma[2], plataforma[3], plataforma[4]);
        }

        //seteamos las puertas
        for (var i = 0; i < nivel.gates.length; i++) {
            var gate = nivel.gates[i];
            this.gates[i] = new Game.Gate(gate);
        }

        //seteamos los bloques
        for (var l = 0; l < nivel.blocks.length; l++) {
            var block = nivel.blocks[l];
            this.blocks[l] = new Game.Block(block[0] * this.tile_set.tile_size, block[1] * this.tile_set.tile_size, block[2] * this.tile_set.tile_size, block[1] * this.tile_set.tile_size + block[3] * this.tile_set.tile_size);
        }
        //si el jugador ha entrado en la puerta
        if (this.gate) {
            //seteamos la posicion del personaje (tanto x como y) en la posicion de destino de la puerta
            if (this.gate.destino_x != -1) {
                this.personaje.setCentroX(this.gate.destino_x);
                this.personaje.setCentroXAux(this.gate.destino_x);
            }
            if (this.gate.destino_y != -1) {
                this.personaje.setCentroY(this.gate.destino_x);
                this.personaje.setCentroYAux(this.gate.destino_y);
            }
            //reseteamos la puerta para no entrar en bucle infinito
            this.gate = undefined;
        }
    },

    //funcion de actualizar el mundo
    update: function() {

        //actualizar por friccion y gravedad
        this.personaje.vx = Math.round(this.personaje.vx *= this.friccion);
        this.personaje.vy += this.gravedad;
        this.personaje.moverPersonaje();
        this.personaje.animarPersonaje();

        //this.personaje.vy*=this.friccion;
        this.collision(this.personaje);
        //recorremos todas las puertas de la zona y comprobamos si el jugador colisiona con algnuna y cuando colisiona seteamos la puerta
        for (var i = 0; i < this.gates.length; i++) {
            let gate2 = this.gates[i];
            if (gate2.colisionCentral(this.personaje)) {
                this.gate = gate2;
            }
        }
        for (let j = 0; j < this.coins.length; j++) { //update monedas
            let coin = this.coins[j];
            coin.mover();
            coin.animar();
            if (coin.colisionObjeto(this.personaje)) {
                this.coins.splice(this.coins.indexOf(coin), 1);
                this.score--;
            }
        }
        for (let k = 0; k < this.spikes.length; k++) { //update spike
            let spike = this.spikes[k];
            spike.update();
            spike.animar();
            if (spike.colisionObjeto(this.personaje)) {
                this.personaje.perderVida();
            }
        }
        for (let l = 0; l < this.blocks.length; l++) { //update blocks
            let block = this.blocks[l];

            block.updateBlock(this.personaje);

            block.animar();

            if (block.colisionObjeto(this.personaje)) {
                this.personaje.perderVida();
            }
        }
        for (let m = 0; m < this.platforms.length; m++) { //update platforms
            let platform = this.platforms[m];
            platform.update();
            platform.animar();

            if (this.personaje.getDcha() > platform.getIzq() && this.personaje.getIzq() < platform.getDcha()) {
                if (this.personaje.getAbajo() > platform.getArriba() && this.personaje.getAbajoAux() <= platform.getArriba()) {
                    this.personaje.setAbajo(platform.getArriba());
                    this.personaje.vy = 0;
                    this.personaje.saltando = false;
                    if (this.personaje.vx == 0) {
                        this.personaje.x += platform.velocity_x - this.personaje.vx;
                    }
                }
            }
        }
    },
    collision: function(o) {

        var arriba, abajo, izq, dcha, value;

        //valores de columna fila de la esquina superior izquierda 
        arriba = Math.floor(o.getArriba() / this.tile_set.tile_size);
        izq = Math.floor(o.getIzq() / this.tile_set.tile_size);
        value = this.mapa[arriba * this.columnas + izq];
        this.collider.collide(value, o, izq * this.tile_set.tile_size, arriba * this.tile_set.tile_size, this.tile_set.tile_size);

        //esquina superior derecha
        arriba = Math.floor(o.getArriba() / this.tile_set.tile_size);
        dcha = Math.floor(o.getDcha() / this.tile_set.tile_size);
        value = this.mapa[arriba * this.columnas + dcha];
        this.collider.collide(value, o, dcha * this.tile_set.tile_size, arriba * this.tile_set.tile_size, this.tile_set.tile_size);

        //esquina inferior izquierda
        abajo = Math.floor(o.getAbajo() / this.tile_set.tile_size);
        izq = Math.floor(o.getIzq() / this.tile_set.tile_size);
        value = this.mapa[abajo * this.columnas + izq];
        this.collider.collide(value, o, izq * this.tile_set.tile_size, abajo * this.tile_set.tile_size, this.tile_set.tile_size);

        //esquina inferior derecha
        abajo = Math.floor(o.getAbajo() / this.tile_set.tile_size);
        dcha = Math.floor(o.getDcha() / this.tile_set.tile_size);
        value = this.mapa[abajo * this.columnas + dcha];
        this.collider.collide(value, o, dcha * this.tile_set.tile_size, abajo * this.tile_set.tile_size, this.tile_set.tile_size);
    }

}

///////////////////////////////////////////////////////////////////////////// COLISIONES /////////////////////////////////////////////////////////////////////////////
//controla las colisiones dependiendo del tile que sea (por ejemplo si colisiona con pinchos, bloques etc)
Game.Collider = function() {
        //colisiones dependiendo del bloque que sea
        this.collide = function(value, obj, tile_x, tile_y, tile_size) {
            switch (value) {
                case 3:
                    this.colisionPinchosSup(obj, tile_y + tile_size / 2.5)
                    break;
                case 4:
                    this.colisionPinchosInf(obj, tile_y + (tile_size / 2.5))
                    break;
                case 0:
                    if (this.colisionSuperior(obj, tile_y)) return;
                    if (this.colisionIzq(obj, tile_x)) return;
                    if (this.colisionDcha(obj, tile_x + tile_size)) return;
                    this.colisionInferior(obj, tile_y + tile_size);
                    break;
                case 2:
                    this.colisionSuperior(obj, tile_y);
                    break;
                case 20:
                    if (this.colisionSuperior(obj, tile_y)) return;
                    if (this.colisionInferior(obj, tile_y + tile_size)) return;
                    this.colisionDcha(obj, tile_x + tile_size);
                    break;
                case 21:
                    if (this.colisionSuperior(obj, tile_y)) return;
                    if (this.colisionInferior(obj, tile_y + tile_size)) return;
                    this.colisionIzq(obj, tile_x);
                    break;

            }
        }
    }
    //funciones para cada tipo de colision
Game.Collider.prototype = {
    constructor: Game.Collider,

    //**********************************SUPERIOR***************************** */
    colisionSuperior: function(o, tile_sup) {
        if (o.getAbajo() > tile_sup && o.getAbajoAux() <= tile_sup) {
            o.setAbajo(tile_sup - 0.01);
            o.vy = 0;
            o.saltando = false; //hacemos que deje de saltar si colisiona arriba
            return true;
        }
        return false;
    },

    //**********************************INFERIOR***************************** */
    colisionInferior: function(o, tile_inf) {
        if (o.getArriba() < tile_inf && o.getArribaAux() >= tile_inf) {
            o.setArriba(tile_inf);
            o.vy = 0;
            return true;
        }
        return false;
    },

    //**********************************IZQUIERDA***************************** */
    colisionIzq: function(o, tile_izq) {
        if (o.getDcha() > tile_izq && o.getDchaAux() <= tile_izq) {
            o.setDcha(tile_izq - 0.01);
            o.vx = 0;
            return true;
        }
        return false;
    },

    //**********************************DERECHA***************************** */
    colisionDcha: function(o, tile_dcha) {
        if (o.getIzq() < tile_dcha && o.getIzqAux() >= tile_dcha) {
            o.setIzq(tile_dcha);
            o.vx = 0;
            return true;
        }
        return false;
    },

    //Pinchos superiores
    colisionPinchosSup: function(o, tile_inf) {
        if (o.getArriba() > tile_inf && o.getArribaAux() <= tile_inf) {
            o.perderVida();
        }
        return false;
    },
    //Pinchos inferiores
    colisionPinchosInf: function(o, tile_sup) {
        if (o.getAbajo() >= tile_sup) {
            o.vx = 0;
            o.perderVida();
        } else if (o.getAbajo() >= tile_sup)
            return false;
    }
}



///////////////////////////////////////////////////////////////////////////// CONSTRUCTOR OBJETO /////////////////////////////////////////////////////////////////////////////
Game.Object = function(x, y, width, height) {
    this.height = height;
    this.width = width;
    this.x = x;
    this.aux_x = x;
    this.y = y;
    this.aux_y = y;
}

Game.Object.prototype = {
    constructor: Game.Object,
    colisionObjeto: function(o) {
        if (this.getDcha() < o.getIzq() ||
            this.getAbajo() < o.getArriba() ||
            this.getIzq() > o.getDcha() ||
            this.getArriba() > o.getAbajo()) return false;
        return true;
    },
    //funcion que devuelve un booleano para saber si el centro del objeto que pasamos colisiona con el borde de la puerta
    colisionCentral: function(o) {
        var x_central = o.getCentroX();
        var y_central = o.getCentroY();

        if (
            y_central < this.getArriba() ||
            y_central > this.getAbajo() ||
            x_central < this.getIzq() ||
            x_central > this.getDcha()) {
            return false;
        } else {
            return true;
        }
    },
    //gets
    getArriba: function() {
        return this.y;
    },
    getArribaAux: function() {
        return this.aux_y;
    },
    getAbajo: function() {
        return this.y + this.height;
    },
    getAbajoAux: function() {
        return this.aux_y + this.height;
    },
    getIzq: function() {
        return this.x;
    },
    getIzqAux: function() {
        return this.aux_x;
    },
    getDcha: function() {
        return this.x + this.width;
    },
    getDchaAux: function() {
        return this.aux_x + this.width;
    },
    getCentroX: function() {
        return this.x + this.width / 2;
    },
    getCentroXAux: function() {
        return this.aux_x + this.width / 2;
    },
    getCentroY: function() {
        return this.y + this.height / 2;
    },
    getCentroYAux: function() {
        return this.aux_y + this.height / 2;
    },
    //sets
    setArriba: function(i) {
        this.y = i;
    },
    setArribaAux: function(i) {
        this.aux_y = i;
    },
    setAbajo: function(i) {
        this.y = i - this.height;
    },
    setAbajoAux: function(i) {
        this.aux_y = i - this.height;
    },
    setIzq: function(i) {
        this.x = i;
    },
    setIzqAux: function(i) {
        this.aux_x = i;
    },
    setDcha: function(i) {
        this.x = i - this.width;
    },
    setDchaAux: function(i) {
        this.aux_x = i - this.width;
    },
    setCentroX: function(i) {
        return this.x = i - this.width * 0.5;
    },
    setCentroXAux: function(i) {
        return this.aux_x = i - this.width * 0.5;
    },
    setCentroY: function(i) {
        return this.y = i - this.height * 0.5;
    },
    setCentroYAux: function(i) {
        return this.aux_y = i - this.height * 0.5;
    },
}


///////////////////////////////////////////////////////////////////////////// OBJETO ANIMACIONES /////////////////////////////////////////////////////////////////////////////
Game.Animator = function(frame_set, delay) {
    this.count = 0;
    if (delay >= 1) {
        this.delay = delay;
    } else { delay = 1; }
    this.frame_set = frame_set;
    this.f_index = 0;
    this.f_value = frame_set[0];
    this.loop = true;
}

Game.Animator.prototype = {
    constructor: Game.Animator,

    //
    animar: function() {
        if (this.loop) {
            this.animacion();
        }
    },

    //setear el nuevo array de frames
    setFrame(frame_set, loop, delay = 10, f_index = 0) {
        if (this.frame_set === frame_set) { return; }
        this.count = 0;
        this.delay = delay;
        this.frame_set = frame_set;
        this.f_index = f_index;
        this.f_value = frame_set[f_index];
        this.loop = loop;
    },

    //funcion para recorrer el array de frames en bucle para los movimientos horizontales
    animacion: function() {
        this.count++;
        while (this.count > this.delay) {
            this.count -= this.delay;
            if (this.f_index < this.frame_set.length - 1) {
                this.f_index++;
            } else {
                this.f_index = 0;
            }
            this.f_value = this.frame_set[this.f_index];
        }
    }

}


/////////////////////////////////////////////////////////////////OBJETO PERSONAJE////////////////////////////////////////////

//constructor Personaje
Game.Personaje = function(x, y) {
    this.reaparicion_x = 0;
    this.reaparicion_y = 0;
    Game.Object.call(this, x, y, 21, 25);
    Game.Animator.call(this, Game.Personaje.prototype.frames["dcha"]);
    this.vx = 0;
    this.vy = 0;
    this.saltando = true;
    this.ladomira = 1;
    this.vidas = 4;
}

//funciones personaje
Game.Personaje.prototype = {
    constructor: Game.Personaje,

    //arrays para las animaciones
    frames: {
        //arrays animaciones hacia la derecha
        "dcha": [0],
        "m_dcha": [1, 2, 3, 4, 5, 6],
        "s_dcha": [4],
        //arrays animaciones hacia la izquierda
        "izq": [7],
        "m_izq": [8, 9, 10, 11, 12, 13],
        "s_izq": [11],
    },
    setReaparicionX(i) {
        this.reaparicion_x = i;
    },
    setReaparicionY(i) {
        this.reaparicion_y = i;
    },
    //funcion saltar
    saltar: function() {
        if (!this.saltando) {
            this.saltando = true;
            this.vy -= 18;
        }
    },

    //movimiento izq
    moverIzq: function() {
        this.vx -= 50;
        this.ladomira = -1;
    },

    //movimiento dcha
    moverDcha: function() {
        this.vx += 50;
        this.ladomira = 1;
    },
    //funcion de perder vida
    perderVida: function() {
        this.x = this.reaparicion_x;
        this.y = this.reaparicion_y;
        this.vidas--;
        this.saltando = false;
        this.vx = 0;
        this.vy = 0;
    },

    moverPersonaje: function() {
        this.aux_x = this.x;
        this.aux_y = this.y;
        this.x += this.vx;
        this.y += this.vy;
    },

    //funcion de animar al personaje
    animarPersonaje: function() {
        //dependiendo del lado que mire se le asignan una animacion u otra así como dependiendo de si está saltando o no
        if (this.vy < 0) {
            if (this.ladomira < 0) {
                this.setFrame(this.frames["s_izq"], false);
            } else {
                this.setFrame(this.frames["s_dcha"], false);
            }
        } else if (this.ladomira < 0) {
            if (this.vx < -0.1) {
                this.setFrame(this.frames["m_izq"], true, 3);
            } else {
                this.setFrame(this.frames["izq"], false);
            }
        } else if (this.ladomira > 0) {
            if (this.vx > 0.1) {
                this.setFrame(this.frames["m_dcha"], true, 3);
            } else {
                this.setFrame(this.frames["dcha"], false);
            }
        }
        this.animar();
    }
}

Object.assign(Game.Personaje.prototype, Game.Object.prototype);
Object.assign(Game.Personaje.prototype, Game.Animator.prototype);
Game.Personaje.prototype.constructor = Game.Personaje;


/////////////////////////////////////////PUERTAS PARA CAMBIAR DE NIVEL/////////////////////////////////////////////
Game.Gate = function(gate) {
    Game.Object.call(this, gate.x, gate.y, gate.width, gate.height);
    this.destino_x = gate.destino_x;
    this.destino_y = gate.destino_y;
    this.nivel_destino = gate.nivel_destino;
}
Game.Gate.prototype = {}
Object.assign(Game.Gate.prototype, Game.Object.prototype);
Game.Gate.prototype.constructor = Game.Gate;


//////////////////////////////////////////////////////////////MONEDAS///////////////////////////////////////////////
Game.Coin = function(x, y) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    Game.Object.call(this.x, this.y, this.width, this.height);
    Game.Animator.call(this, Game.Coin.prototype.frame_sets["monedas"], 10);
    this.valor_movimiento = 0;
    this.f_index = 0;
    this.vectory = 0;
}

Game.Coin.prototype = {
    frame_sets: {
        "monedas": [14, 15, 16, 17]
    },
    mover: function() {
        this.vectory -= 0.1;
        this.y += Math.sin(this.vectory) * 0.4;
    }
}
Object.assign(Game.Coin.prototype, Game.Object.prototype);
Object.assign(Game.Coin.prototype, Game.Animator.prototype);

Game.Coin.prototype.constructor = Game.Coin;


//////////////////////////////////////////////////////////spike////////////////////////////////////////////////////
Game.Spike = function(x, y, orientacion, radio, p, v) {
    this.x = x;
    this.aux_x = x;
    this.aux_y = y;
    this.y = y;
    this.v = v;
    this.width = 13;
    this.height = 13;
    this.radio = radio;
    this.orientacion = orientacion;
    Game.Object.call(this.x, this.y, this.width, this.height);
    Game.Animator.call(this, Game.Spike.prototype.frame_sets["spike"], 2);
    this.vx = 0;
    this.vy = 0;
    this.p = p;
}
Game.Spike.prototype = {
    frame_sets: {
        "spike": [18, 19]
    },
    update: function() {
        //1 es horizontal 0 vertical
        if (this.orientacion == 1) {
            if (this.p == 0) {
                this.vx += this.v
            } else if (this.p == 1) {
                this.vx -= this.v
            }
            this.x = this.aux_x + Math.sin(this.vx) * this.radio;
        } else if (this.orientacion == 0) {
            if (this.p == 0) {
                this.vy += this.v
            } else if (this.p == 1) {
                this.vy -= this.v
            }
            this.y = this.aux_y + Math.sin(this.vy) * this.radio;
        }
    }
}

Object.assign(Game.Spike.prototype, Game.Object.prototype);
Object.assign(Game.Spike.prototype, Game.Animator.prototype);

Game.Spike.prototype.constructor = Game.Spike;


Game.Block = function(x, y, y_inicial, y_final) {
    this.x = x;
    this.y = y;
    this.y_inicial = y_inicial;
    this.y_final = y_final;
    this.state = "quieto";
    this.vy = 0;
    this.width = 31.5;
    this.height = 31.5;
    Game.Object.call(this.x, this.y, this.width, this.height);
    Game.Animator.call(this, Game.Block.prototype.frame_sets["bloque"], 2);
}
Game.Block.prototype = {
    frame_sets: { "bloque": [21], "cayendo": [20] },
    updateBlock: function(jugador) {
        switch (this.state) {
            //si esta quieto y el jugador colisiona con su zona inferior pasa a caer
            case "quieto":
                if (jugador.getCentroX() < this.getDcha() && jugador.getCentroX() > this.getIzq() && this.y_final + 32 > jugador.getCentroY() && this.y_inicial + 32 < jugador.getCentroY()) {
                    this.state = "cae";
                }
                break;

                //si esta cayendo y llega al final cambia a elevarse
            case "cae":
                this.setFrame(this.frame_sets["cayendo"], true, 2);
                this.vy = 6;
                this.y += this.vy;
                if (this.y > this.y_final) {
                    this.y = this.y_final;
                    this.vy = 0;
                    this.state = "elevarse";
                }
                break;

                //si esta elevandose y llega al punto inicial pasa al estado quieto
            case "elevarse":
                this.setFrame(this.frame_sets["bloque"], true, 20);
                this.vy = 0.9;
                this.y -= this.vy;
                if (this.getArriba() < this.y_inicial) {
                    this.y = this.y_inicial;
                    this.vy = 0;
                    this.state = "quieto";
                }

        }
    }
}

Object.assign(Game.Block.prototype, Game.Object.prototype);
Object.assign(Game.Block.prototype, Game.Animator.prototype);

Game.Platform = function(x, y, radio, p, v) {
    this.x = x;
    this.aux_x = x;
    this.aux_y = y;
    this.y = y;
    this.v = v;
    this.width = 32;
    this.height = 32;
    this.velocity_x = 0;
    this_velocity_y = 0;
    this.radio = radio;
    Game.Object.call(this.x, this.y, this.width, this.height);
    Game.Animator.call(this, Game.Platform.prototype.frame_sets["Platforms"], 2);
    this.vx = 0;
    this.vy = 0;
    this.p = p;
}

Game.Platform.prototype = {
    frame_sets: {
        "Platforms": [22]
    },
    update: function() {
        //1 es horizontal 0 vertical
        if (this.p == 0) {
            this.vx += this.v;
        } else if (this.p == 1) {
            this.vx -= this.v;
        }
        this.velocity_x = this.aux_x + Math.sin(this.vx) * this.radio - this.x;
        this.x += this.velocity_x;
    }
}


Object.assign(Game.Platform.prototype, Game.Object.prototype);
Object.assign(Game.Platform.prototype, Game.Animator.prototype);
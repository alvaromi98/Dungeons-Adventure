const Controller = function() {

    this.izq = new Controller.ButtonInput();
    this.dcha = new Controller.ButtonInput();
    this.saltar = new Controller.ButtonInput();

    this.keyDownUp = function(type, cod) {


        if (type == "keydown") {
            down = true;
        } else {
            down = false;
        }
        //comprobamos que tecla ha pulsado
        switch (cod) {
            case 37:
                this.izq.getInput(down);
                break;
            case 38:
                this.saltar.getInput(down);
                break;
            case 39:
                this.dcha.getInput(down);
                break;
        }
    };
};
//constructor
Controller.prototype = {
    constructor: Controller
}

Controller.ButtonInput = function() {
    this.active = this.down = false;
}
Controller.ButtonInput.prototype = {
    constructor: Controller.ButtonInput,
    getInput: function(down) {
        if (this.down != down) {
            this.active = down;
            this.down = down;
        }
    }
}
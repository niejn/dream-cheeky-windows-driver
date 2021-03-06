define(['usb', 'signal', 'led', 'trigger', 'deviceConstants', 'shortHandTranslationMap', 'underscore'], function(usb, signal, led, trigger, DEVICE_CONSTANTS, shortHandTranslationMap, __){

    var DCDriver = {};

    DCDriver.DEVICE_CONSTANTS = DEVICE_CONSTANTS;

    DCDriver.turnOnDebugMode = function(){
        usb.setDebugLevel(4);
    };

    DCDriver.turnOffDebugMode = function(){
        usb.setDebugLevel(0);
    };


    DCDriver.moveUp = function (durationMS, callback) {
        signal(DEVICE_CONSTANTS.CMD.UP, durationMS, callback);
    };

    DCDriver.moveDown = function (durationMS, callback) {
        signal(DEVICE_CONSTANTS.CMD.DOWN, durationMS, callback);
    };

    DCDriver.moveLeft = function (durationMS, callback) {
        signal(DEVICE_CONSTANTS.CMD.LEFT, durationMS, callback);
    };

    DCDriver.moveRight = function (durationMS, callback) {
        signal(DEVICE_CONSTANTS.CMD.RIGHT, durationMS, callback);
    };

    DCDriver.led = function (active, callback) {
        var cmd = (true == active) ? DEVICE_CONSTANTS.LED.ENABLED : DEVICE_CONSTANTS.LED.DISABLED;
        led(cmd, callback);
    };

    DCDriver.stop = function (callback) {
        if (__.isFunction(callback) && callback !== DCDriver.stop) {
            signal(DEVICE_CONSTANTS.CMD.STOP, 0, callback);
        } else {
            signal(DEVICE_CONSTANTS.CMD.STOP);
        }
    };

    DCDriver.fire = function (number, callback) {
        number = __.isNumber(number) && number >= 0 && number <= DEVICE_CONSTANTS.MISSILES.NUMBER ? number : 1;
        if (number === 0) {
            DCDriver.stop(callback);
        } else {
            signal(DEVICE_CONSTANTS.CMD.FIRE, DEVICE_CONSTANTS.MISSILES.RELOAD_DELAY_MS, trigger(DCDriver.fire, number - 1, callback));
        }
    };

    DCDriver.park = function (callback) {
        var parkChain = [
            {command: 'l', ms: 8000},
            {command: 'd', ms: 2000}
        ];
        DCDriver.chain(parkChain, callback);
    };

    DCDriver.chain = function(array, callback){

        var callNext = function(next){
            setTimeout(next, 500);
        };

        var execute = function(index){

            var command = array[index];
            var func = DCDriver[shortHandTranslationMap[command.command]];

            var next = callNext.bind(this, execute.bind(this, index + 1));

            if (index === array.length - 1){
                next = callback;
            }

            if (func === DCDriver.park || func === DCDriver.stop) {
                func(next);
            }
            else if (func === DCDriver.file) {
                func(1, next);
            }
            else {
                var number = command.ms;
                func(number, next);
            }
        };

        execute(0);
    };

    DCDriver.execute = function (commands, callback) {
        if (__.isString(commands)) {
            DCDriver.execute(commands.split(','), callback);
        } else if (commands.length === 0) {
            DCDriver.stop(callback);
        } else {
            var command = commands.shift();
            var func = command.length > 0 ? DCDriver[shortHandTranslationMap[command[0]]] : null;
            if (__.isFunction(func)) {
                var next = trigger(DCDriver.execute, commands, callback);
                if (func === DCDriver.park || func === DCDriver.stop) {
                    func(next);
                } else {
                    var number;
                    try {
                        number = parseInt(command.substring(1), 10);
                    } catch (ignore) {
                        number = null;
                    }
                    func(number, next);
                }
            } else {
                console.warn('Ignoring bad command: ' + command);
                DCDriver.execute(commands, callback);
            }
        }
    };

    return DCDriver;
});
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Jalousie = void 0;
const control_base_1 = require("./control-base");
class Jalousie extends control_base_1.ControlBase {
    constructor() {
        super(...arguments);
        // The upDownChangeHandler callback will be triggered when any movement starts or stops.
        // Normally we want upDownChangeHandler to clear any target as it signifies manual command
        // has occurred. This can happen in normal use or before a target has been reached for
        // example.
        // But in the case of movement started as a result of an auto-position command, we don't
        // want to clear that target.
        // For this reason we have the below boolean that tells upDownChangeHandler to ignore the
        // first change it sees after an auto-position command is started.
        this.upDownAutoCommandHandled = false;
    }
    async loadAsync(type, uuid, control) {
        await this.updateObjectAsync(uuid, {
            type: type,
            common: {
                name: control.name,
                role: 'blind',
            },
            native: { control: control },
        });
        await this.loadOtherControlStatesAsync(control.name, uuid, control.states, [
            'up',
            'down',
            'position',
            'shadePosition',
            'safetyActive',
            'autoAllowed',
            'autoActive',
            'locked',
        ]);
        await this.createBooleanControlStateObjectAsync(control.name, uuid, control.states, 'up', 'indicator', {
            write: true,
        });
        this.addStateEventHandler(control.states.up, () => this.upDownChangeHandler(), 'up');
        await this.createBooleanControlStateObjectAsync(control.name, uuid, control.states, 'down', 'indicator', {
            write: true,
        });
        this.addStateEventHandler(control.states.down, () => this.upDownChangeHandler(), 'down');
        await this.createPercentageControlStateObjectAsync(control.name, uuid, control.states, 'position', 'level.blind', {
            write: true,
        });
        await this.createPercentageControlStateObjectAsync(control.name, uuid, control.states, 'shadePosition', 'level');
        await this.createBooleanControlStateObjectAsync(control.name, uuid, control.states, 'safetyActive', 'indicator');
        await this.createBooleanControlStateObjectAsync(control.name, uuid, control.states, 'autoAllowed', 'indicator');
        await this.createBooleanControlStateObjectAsync(control.name, uuid, control.states, 'autoActive', 'indicator', {
            write: true,
        });
        await this.createBooleanControlStateObjectAsync(control.name, uuid, control.states, 'locked', 'indicator');
        await this.createSimpleControlStateObjectAsync(control.name, uuid, control.states, 'infoText', 'string', 'text');
        this.addStateChangeListener(uuid + '.up', (oldValue, newValue) => {
            if (newValue) {
                this.sendCommand(control.uuidAction, 'up');
            }
            else {
                this.sendCommand(control.uuidAction, 'UpOff');
            }
        });
        this.addStateChangeListener(uuid + '.down', (oldValue, newValue) => {
            if (newValue) {
                this.sendCommand(control.uuidAction, 'down');
            }
            else {
                this.sendCommand(control.uuidAction, 'DownOff');
            }
        });
        this.addStateChangeListener(uuid + '.autoActive', (oldValue, newValue) => {
            if (newValue == oldValue) {
                return;
            }
            else if (newValue) {
                this.sendCommand(control.uuidAction, 'auto');
            }
            else {
                this.sendCommand(control.uuidAction, 'NoAuto');
            }
        });
        // for Alexa support:
        // ... but this is not really Alexa specific to be fair
        if (control.states.position) {
            this.addStateChangeListener(uuid + '.position', (oldValue, newValue) => {
                oldValue = this.convertStateToInt(oldValue);
                newValue = Math.max(0, Math.min(100, this.convertStateToInt(newValue))); // 0 <= newValue <= 100
                if (oldValue == newValue) {
                    return;
                }
                if (newValue == 100) {
                    this.sendCommand(control.uuidAction, 'FullDown');
                    return;
                }
                if (newValue === 0) {
                    this.sendCommand(control.uuidAction, 'FullUp');
                    return;
                }
                this.upDownAutoCommandHandled = false;
                if (oldValue < newValue) {
                    this.positionTarget = (newValue - 5) / 100;
                    this.sendCommand(control.uuidAction, 'down');
                }
                else {
                    // Negative here because we use -ve numbers to indicate movement up
                    this.positionTarget = -(newValue + 5) / 100;
                    this.sendCommand(control.uuidAction, 'up');
                }
            });
            this.addStateEventHandler(control.states.position, async (value) => {
                if (typeof this.positionTarget === 'number') {
                    // Below, the actual command ('up' or 'down') is irrelevant but we
                    // need to know the direction for target test.
                    if (this.positionTarget > 0) {
                        // Going down
                        if (value >= this.positionTarget) {
                            this.positionTarget = undefined;
                            await this.sendCommand(control.uuidAction, 'down');
                        }
                    }
                    else {
                        // Going up - don't forget target is negative
                        if (value <= -this.positionTarget) {
                            this.positionTarget = undefined;
                            await this.sendCommand(control.uuidAction, 'up');
                        }
                    }
                }
            }, 'auto');
        }
        await this.createButtonCommandStateObjectAsync(control.name, uuid, 'fullUp');
        this.addStateChangeListener(uuid + '.fullUp', () => {
            this.sendCommand(control.uuidAction, 'FullUp');
        });
        await this.createButtonCommandStateObjectAsync(control.name, uuid, 'fullDown');
        this.addStateChangeListener(uuid + '.fullDown', () => {
            this.sendCommand(control.uuidAction, 'FullDown');
        });
        await this.createButtonCommandStateObjectAsync(control.name, uuid, 'shade');
        this.addStateChangeListener(uuid + '.shade', () => {
            this.sendCommand(control.uuidAction, 'shade');
        });
    }
    async upDownChangeHandler() {
        if (this.upDownAutoCommandHandled) {
            this.positionTarget = undefined;
        }
        else {
            this.upDownAutoCommandHandled = true;
        }
    }
}
exports.Jalousie = Jalousie;
//# sourceMappingURL=Jalousie.js.map
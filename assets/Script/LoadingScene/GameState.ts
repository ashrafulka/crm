export enum States {
    NULL = 0,
    WAITING_FOR_FRIEND_TO_CONNECT
}

export class GameState {

    currState: States = States.NULL;
    constructor() {
        this.currState = States.NULL;
    }

    GetCurrentState(): States {
        return this.currState;
    }

    ChangeState(newState: States) {
        switch (newState) {
            case States.WAITING_FOR_FRIEND_TO_CONNECT:
                this.currState = States.WAITING_FOR_FRIEND_TO_CONNECT;
                break;
            default:

                break;
        }
    }

}

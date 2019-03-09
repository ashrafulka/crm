export enum States {
    NULL = 0,
    PRE_LOAD,
    CONNECTING,
    LOGGING_IN,
    LOGGED_IN,
    IN_LOBBY,
    FINDING_MATCH,
    WAITING_FOR_FRIEND_TO_CONNECT,
    IN_GAME,
    GAME_END
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
            case States.PRE_LOAD:

                break;

            case States.CONNECTING:

                break;

            case States.LOGGING_IN:

                break;

            case States.LOGGED_IN:

                break;

            case States.IN_LOBBY:

                break;

            case States.FINDING_MATCH:

                break;

            case States.WAITING_FOR_FRIEND_TO_CONNECT:
                this.currState = States.WAITING_FOR_FRIEND_TO_CONNECT;
                break;

            case States.IN_GAME:

                break;

            case States.GAME_END:

                break;
            default:

                break;
        }
    }

}

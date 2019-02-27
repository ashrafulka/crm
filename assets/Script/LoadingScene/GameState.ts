export enum States {
    NULL = 0,
    PRE_LOAD,
    CONNECTING,
    LOGGING_IN,
    LOGGED_IN,
    IN_LOBBY,
    FINDING_MATCH,
    IN_GAME,
    GAME_END
}

export class GameState {

    currState: States = States.NULL;
    constructor() {
        this.currState = States.NULL;
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

            case States.IN_GAME:

                break;

            case States.GAME_END:

                break;
            default:

                break;
        }
    }

}

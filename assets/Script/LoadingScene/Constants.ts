export class Constants {
    static IS_LOG_ENABLED: boolean = true;
    static HEROKU_SRVR_ADDR: string = "https://carrom-ulka.herokuapp.com";
    static HEROKU_WS_ADDR: string = "wss://carrom-ulka.herokuapp.com";
    static SIGNED_PLAYER_ASYNC_FLAG = "meta-data";
    static PERSISTENT_NODE_NAME = "PersistentNode";

    static MAX_RETRY_COUNT: number = 3;
}

export class GameScenes {
    static LOADING: string = "loading";
    static LOBBY: string = "lobby";
    static GAME: string = "game"
}

export class ConnectionStrings {
    static CONNECTION_STR: string = "/connect";
    static LOGIN_STR: string = "/login";
    static FRIEND_1v1: string = "/friend1v1";
}

export enum GameType {
    CARROM = 0,
    RANDOM
}

export enum AllGameModes {
    QUICK_MATCH = 0,
    FRIEND_1v1,
    BOT
}

export class GameEvents {
    static SUCCESS_CONNECTION: string = "scs_conn";
    static SUCCESS_LOGIN: string = "scs_login";
    static FAILED_LOGIN: string = "failed_login";
    static ROOM_CREATION_SUCCESS: string = "room_create_success";
    static ROOM_JOIN_SUCCESS: string = "room_join_success";
    static START_GAME: string = "start_game_success";
    static SERVER_ERR: string = "server_error";

    //=====================

    static ASSIGN_PLAYER: string = "asgn_player";
    static UNLOCK_STRIKER: string = "unlock_strkr";
    static LOCK_STRIKER: string = "lock_strkr";
    static TAKE_SHOT: string = "take_shot";
    static SYNC_PAWNS: string = "sync_pawns";
    static UPDATE_SCORE: string = "update_score";
    static POT: string = "pot";
}

export class RequestTypes {
    static CREATE_ROOM: string = "create_room";
    static JOIN_ROOM: string = "join_room";
    static REQUEST_TURN: string = "rqst_turn";
}
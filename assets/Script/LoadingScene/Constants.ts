export class Constants {
    static IS_LOG_ENABLED: boolean = true;
    static HEROKU_SRVR_ADDR: string = "https://carrom-ulka.herokuapp.com";
    static HEROKU_WS_ADDR: string = "wss://carrom-ulka.herokuapp.com";
    static SIGNED_PLAYER_ASYNC_FLAG = "meta-data";
    static PERSISTENT_NODE_NAME = "PersistentNode";
}

export class GameScenes {
    static LOADING: string = "loading";
    static LOBBY: string = "lobby";
    static GAME: string = "game"
}

export class ConnectionStrings {
    static CONNECTION_STR: string = "/connection";
    static LOGIN_STR: string = "/login";
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
    static ROOM_JOIN_FAILED: string = "room_join_failed";
    static ROOM_CREATION_FAILED: string = "room_create_fail";
    static START_GAME: string = "start_game_success";
    static START_GAME_FAIL: string = "start_game_fail";
}

export class RequestTypes {
    static CREATE_ROOM: string = "create_room";
    static JOIN_ROOM: string = "join_room";
}
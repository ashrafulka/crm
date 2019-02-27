
export class Constants {
    static IS_LOG_ENABLED: boolean = true;
    static HEROKU_SRVR_ADDR: string = "https://carrom-ulka.herokuapp.com";
    static HEROKU_WS_ADDR: string = "wss://carrom-ulka.herokuapp.com";
    static SIGNED_PLAYER_ASYNC_FLAG = "meta-data";
}

export class GameEvents {
    static SUCCESS_CONNECTION: string = "scs_conn";
    static SUCCESS_LOGIN: string = "scs_login";
    static FAILED_LOGIN: string = "failed_login";
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
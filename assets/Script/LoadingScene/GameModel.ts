
import { PlayerModel } from "./PlayerModel";
import { GameType, AllGameModes } from "./Constants";

export class GameModel {
    private mGameMode: AllGameModes;
    private mRoomID: string;

    SetGameMode(gm: AllGameModes) {
        this.mGameMode = gm;
    }

    GetGameMode(): AllGameModes {
        return this.mGameMode;
    }

    SetRoomID(rid: string) {
        this.mRoomID = rid;
    }

    GetRoomID() {
        return this.mRoomID;
    }

}
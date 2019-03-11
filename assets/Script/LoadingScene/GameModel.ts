
import { PlayerModel } from "./PlayerModel";
import { GameType, AllGameModes } from "./Constants";

export class GameModel {
    private mGameMode: AllGameModes;
    private mRoomID: string;
    private initiatorID: string;
    private initiatorName: string;

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

    SetInitiator(id: string, name: string) {
        this.initiatorID = id;
        this.initiatorName = name;
    }

    GetInitiatorID() {
        return this.initiatorID;
    }

    GetInitatorName() {
        return this.initiatorName;
    }

}
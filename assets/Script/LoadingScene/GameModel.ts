
import { PlayerModel } from "./PlayerModel";
import { GameType, GameMode } from "./Constants";

export class GameModel {
    private mGameMode: GameMode;
    private mGamePlayers: PlayerModel[];

    SetGameMode(gm: GameMode) {
        this.mGameMode = gm;
    }

    GetGameMode(): GameMode {
        return this.mGameMode;
    }

    AddPlayer(player: PlayerModel) {
        this.mGamePlayers.push(player);
    }

}
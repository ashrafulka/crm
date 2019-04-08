import PawnComponent, { PawnType } from "./Pawn";
import BoardManager from "./Managers/BoardManager";

export enum BoardState {
    NONE = 0,
    NO_POT,
    VALID_POT,
    FOUL,
    RED_POT,
    RED_COVERED,
    RED_COVER_FAILED,
    GAME_OVER
}

export enum FoulTypes {
    STRIKER_POT = 1,
    BOARD_EMPTY_WITHOUT_COVER,
    NO_REMAINING_POTS_WIHTOUT_COVER,
    RED_COVER_FAILED
}

export class Player {

    private mId: string = "";
    private mName: string = "";
    private mScore: number = 0;
    private mPawnType: PawnType = PawnType.NONE;

    private mIsRedCovered: boolean = false;
    private myTypePots: Array<PawnComponent> = [];

    constructor(id: string, name: string) {
        this.mId = id;
        this.mName = name;
    }

    GetID(): string {
        return this.mId;
    }

    GetName(): string {
        return this.mName;
    }

    AddToScore(amount: number) {
        this.mScore += amount;
    }

    GetScore(): number {
        return this.mScore;
    }

    SetScore(newScore) {
        this.mScore = newScore;
    }

    SetType(type: PawnType) {
        this.mPawnType = type;
    }

    GetCurrentPawnType(): PawnType {
        return this.mPawnType;
    }

    GetCurrentPawnTypeString(): string {
        if (this.mPawnType == PawnType.BLACK)
            return "Black";
        else
            return "White"
    }

    RedCover() {
        BoardManager.IS_RED_COVERED = true;
        this.mIsRedCovered = true;
    }

    IsRedCovered() {
        return this.mIsRedCovered;
    }
}
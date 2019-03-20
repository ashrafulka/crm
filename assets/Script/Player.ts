import { PawnType } from "./Pawn";

export class Player {

    private mId: string = "";
    private mName: string = "";
    //private mBoardIndex: number = -1;
    private mScore: number = 0;
    private mPawnType: PawnType = PawnType.NONE;

    constructor(id: string, name: string) {
        this.mId = id;
        this.mName = name;
        //this.mBoardIndex = bIndex;
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

}

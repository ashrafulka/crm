import { PawnType } from "./Pawn";

export class Player {

    private mId: string = "";
    private mName: string = "";
    private mBoardIndex: number = -1;
    private mScore: number = 0;
    private mPawnType: PawnType = PawnType.NONE;

    constructor(id: string, name: string, bIndex: number) {
        this.mId = id;
        this.mName = name;
        this.mBoardIndex = bIndex;
    }

    GetID(): string {
        return this.mId;
    }

    GetName(): string {
        return this.mName;
    }

    GetBoardIndex(): number {
        return this.mBoardIndex;
    }

    AddToScore(amount: number) {
        this.mScore += amount;
    }

    GetScore(): number {
        return this.mScore;
    }

    SetType(type: PawnType) {
        this.mPawnType = type;
    }

    GetCurrentPawnType(): PawnType {
        return this.mPawnType;
    }

}

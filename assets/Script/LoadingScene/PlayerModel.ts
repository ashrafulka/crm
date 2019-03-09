export class PlayerModel {
    private mName: string = "";
    private mID: string = "";
    private mPhotoURL: string = "";
    private mContextID: string = "";
    private mContextType: string = "";
    private mSignature: string = "";
    private entryPointData: any;
    private mBoardIndex: number = 0;

    constructor(name: string, id: string) {
        this.mID = id;
        this.mName = name;
    }

    getName(): string {
        return this.mName;
    }

    getID(): string {
        return this.mID;
    }

    getSignature(): string {
        return this.mSignature;
    }

    setSignature(signature: string) {
        this.mSignature = signature;
    }

    setPhotoURL(url: string) {
        this.mPhotoURL = url;
    }

    setContextID(contextID: string) {
        this.mContextID = contextID;
    }

    getContextID(): string {
        return this.mContextID;
    }

    setContextType(ctype: string) {
        this.mContextType = ctype;
    }

    getContextType(): string {
        return this.mContextType;
    }

    setEntryPointData(data: any) {
        console.log("setting entry point data : ", data);
        this.entryPointData = data;
    }

    getEntryPointData(): any {
        return this.entryPointData;
    }

    setBoardIndex(bid: number) {
        this.mBoardIndex = bid;
    }

    getBoardIndex(): number {
        return this.mBoardIndex;
    }
}//player
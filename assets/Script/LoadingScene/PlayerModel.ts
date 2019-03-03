export class PlayerModel {

    mName: string = "";
    mID: string = "";
    mPhotoURL: string = "";
    mContextID: string = "";
    mContextType: string = "";
    mSignature: string = "";
    entryPointData: string = "";

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

    setEntryPointData(data) {
        console.log("setting entry point data : ", data);
        this.entryPointData = data;
    }

    getEntryPointData(): string {
        return this.entryPointData;
    }
}//player
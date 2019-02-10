export class Player {

    private mId: string = "";
    private mName: string = "";

    constructor(id: string, name: string) {
        this.mId = id;
        this.mName = name;
    }

    getID(): string {
        return this.mId;
    }

    getName(): string {
        return this.mName;
    }

}

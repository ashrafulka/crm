import { Constants } from "./Constants";

export class Logger {

    mKey: string = "";

    constructor(key: string) {
        this.mKey = key;
    }

    Log(msg: string, obj?: any) {
        if (Constants.IS_LOG_ENABLED) {
            console.log(this.mKey + " : " + msg, obj);
        }
    }
}
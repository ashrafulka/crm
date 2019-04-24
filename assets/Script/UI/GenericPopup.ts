const { ccclass, property } = cc._decorator;

export enum GenericPopupBtnType {
    POSITIVE = 1,
    NEGATIVE,
    NEUTRAL
}

@ccclass
export default class GenericPopup extends cc.Component {

    @property(cc.Label) gPopupMsgLabel: cc.Label = null;
    @property(cc.Label) gPopupTitleLabel: cc.Label = null;
    @property(cc.Label) gPopupBtnLabel: cc.Label = null;
    @property(cc.Button) gPopupBtn: cc.Button = null;
    @property(cc.Node) gPopupPositiveBtnBG: cc.Node = null;
    @property(cc.Node) gPopupNegativeBtnBG: cc.Node = null;
    @property(cc.Node) gPopupNeutralBtnBG: cc.Node = null;

    Initialize(msg: string, title: string, btnLabel?: string, btnClick?: cc.Component.EventHandler, popupType?: GenericPopupBtnType) {
        this.gPopupMsgLabel.string = msg;
        this.gPopupTitleLabel.string = title;

        this.gPopupBtnLabel.string = btnLabel ? btnLabel : "";
        this.ResetButton(this.gPopupBtn);

        if (btnClick != null) {
            this.gPopupBtn.node.active = true;
            this.gPopupBtn.clickEvents.push(btnClick);
            if (popupType) {
                switch (popupType) {
                    case GenericPopupBtnType.POSITIVE:
                        this.gPopupPositiveBtnBG.active = true;
                        this.gPopupNegativeBtnBG.active = false;
                        this.gPopupNeutralBtnBG.active = false;
                        break;
                    case GenericPopupBtnType.NEGATIVE:
                        this.gPopupPositiveBtnBG.active = false;
                        this.gPopupNegativeBtnBG.active = true;
                        this.gPopupNeutralBtnBG.active = false;
                        break;
                    case GenericPopupBtnType.NEUTRAL:
                        this.gPopupPositiveBtnBG.active = false;
                        this.gPopupNegativeBtnBG.active = false;
                        this.gPopupNeutralBtnBG.active = true;
                        break;
                }
            }
        } else {
            this.gPopupBtn.node.active = false;
        }
    }

    ResetButton(btn: cc.Button) {
        if (btn && btn.clickEvents && btn.clickEvents.length > 0) {
            for (var i = 0; i < btn.clickEvents.length; i++) {
                btn.clickEvents.pop();
            }
        }
    }

    // update (dt) {}
}

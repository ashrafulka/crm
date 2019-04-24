const { ccclass, property } = cc._decorator;

@ccclass
export default class LobbyUIManager extends cc.Component {

    @property(cc.Label) myNameLabel: cc.Label = null;
    @property(cc.Label) opponentNameLabel: cc.Label = null;

    @property(cc.Node) quickMatchPanel: cc.Node = null;
    @property(cc.Node) qmSearchingNode: cc.Node = null;
    @property(cc.Node) qmMatchFoundNode: cc.Node = null

    start() {
        this.quickMatchPanel.active = false;
    }

    ShowQuickMatchPanel(durationOfSearch: number, mName: string, oppName: string) {
        this.quickMatchPanel.active = true;
        this.qmSearchingNode.active = true;
        this.qmMatchFoundNode.active = false;

        let self = this;
        this.scheduleOnce(function () {
            self.ShowMatchFoundPanel(mName, oppName);
        }, durationOfSearch);
    }//showsearchingnode

    private ShowMatchFoundPanel(myName: string, oppName: string) {
        this.qmSearchingNode.active = false;
        this.qmMatchFoundNode.active = true;
        this.myNameLabel.string = myName;
        this.opponentNameLabel.string = oppName;
    }
}

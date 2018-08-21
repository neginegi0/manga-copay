import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

// providers
import { WalletProvider } from '../../providers/wallet/wallet';

@Component({
  selector: 'page-payrpo',
  templateUrl: 'paypro.html'
})
export class PayProPage {
  public tx;
  public address: string;

  constructor(
    private navParams: NavParams,
    private viewCtrl: ViewController,
    private walletProvider: WalletProvider
  ) {
    this.tx = this.navParams.data.tx;
    this.address = this.walletProvider.getAddressView(
      this.tx.paypro.toAddress
    );
  }

  close() {
    this.viewCtrl.dismiss();
  }
}

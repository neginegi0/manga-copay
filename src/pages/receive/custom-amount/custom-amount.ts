import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// Native
import { SocialSharing } from '@ionic-native/social-sharing';

// providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ProfileProvider } from '../../../providers/profile/profile';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-custom-amount',
  templateUrl: 'custom-amount.html'
})
export class CustomAmountPage {
  public protocolHandler: string;
  public address: string;
  public qrAddress: string;
  public wallet;
  public showShareButton: boolean;
  public amountUnitStr: string;
  public amountCoin: string;
  public altAmountStr: string;

  constructor(
    private navParams: NavParams,
    private profileProvider: ProfileProvider,
    private platformProvider: PlatformProvider,
    private walletProvider: WalletProvider,
    private logger: Logger,
    private socialSharing: SocialSharing,
    private txFormatProvider: TxFormatProvider,
    private actionSheetProvider: ActionSheetProvider
  ) {
    let walletId = this.navParams.data.id;
    this.showShareButton = this.platformProvider.isCordova;

    this.wallet = this.profileProvider.getWallet(walletId);

    this.walletProvider.getAddress(this.wallet, false).then(addr => {
      this.address = this.walletProvider.getAddressView(addr);

      let parsedAmount = this.txFormatProvider.parseAmount(
        this.navParams.data.amount,
        this.navParams.data.currency
      );

      // Amount in USD or MANGA
      let _amount = parsedAmount.amount;
      let _currency = parsedAmount.currency;
      this.amountUnitStr = parsedAmount.amountUnitStr;

      if (_currency != 'MANGA') {
        // Convert to MANGA
        let amountUnit = this.txFormatProvider.satToUnit(
          parsedAmount.amountSat
        );
        var btcParsedAmount = this.txFormatProvider.parseAmount(
          amountUnit,
          _currency
        );

        this.amountCoin = btcParsedAmount.amount;
        this.altAmountStr = btcParsedAmount.amountUnitStr;
      } else {
        this.amountCoin = _amount; // MANGA
        this.altAmountStr = this.txFormatProvider.formatAlternativeStr(
          parsedAmount.amountSat
        );
      }

      this.updateQrAddress();
    });
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad CustomAmountPage');
  }

  private updateQrAddress(): void {
    this.qrAddress =
      this.walletProvider.getProtoAddress(this.address) +
      '?amount=' +
      this.amountCoin;
  }

  public shareAddress(): void {
    this.socialSharing.share(this.qrAddress);
  }

  public showFullInfo(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'custom-amount',
      {
        address: this.address,
        amount: this.amountUnitStr
      }
    );
    infoSheet.present();
  }
}

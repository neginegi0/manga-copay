import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';
import { BwcProvider } from '../bwc/bwc';
import { ConfigProvider } from '../config/config';
import { FilterProvider } from '../filter/filter';
import { RateProvider } from '../rate/rate';

import * as _ from 'lodash';

@Injectable()
export class TxFormatProvider {

  // TODO: implement configService
  public pendingTxProposalsCountForUs: number;

  constructor(
    private bwcProvider: BwcProvider,
    private rate: RateProvider,
    private configProvider: ConfigProvider,
    private filter: FilterProvider,
    private logger: Logger
  ) {
    this.logger.info('TxFormatProvider initialized.');
  }

  // TODO: Check return of formatAmount(...), sometimes returns a number and sometimes a string
  public formatAmount(satoshis: number, fullPrecision?: boolean) {
    let settings = this.configProvider.get().wallet.settings;

    if (settings.unitCode == 'sat') return satoshis;

    // TODO : now only works for english, specify opts to change thousand separator and decimal separator
    var opts = {
      fullPrecision: !!fullPrecision
    };
    return this.bwcProvider
      .getUtils()
      .formatAmount(satoshis, settings.unitCode, opts);
  }

  public formatAmountStr(satoshis: number): string {
    if (isNaN(satoshis)) return undefined;
    return this.formatAmount(satoshis) + ' ' + 'MANGA';
  }

  public toFiat(satoshis: number, code: string): Promise<any> {
    // TODO not a promise
    return new Promise(resolve => {
      if (isNaN(satoshis)) return resolve();
      var v1;
      v1 = this.rate.toFiat(satoshis, code);
      if (!v1) return resolve(null);
      return resolve(v1.toFixed(2));
    });
  }

  public formatToUSD(satoshis: number): Promise<any> {
    // TODO not a promise
    return new Promise(resolve => {
      let v1: number;
      if (isNaN(satoshis)) return resolve();
      v1 = this.rate.toFiat(satoshis, 'USD');
      if (!v1) return resolve(null);
      return resolve(v1.toFixed(2));
    });
  }

  public formatAlternativeStr(satoshis: number): string {
    if (isNaN(satoshis)) return undefined;
    let settings = this.configProvider.get().wallet.settings;

    let val = (() => {
      var v1 = parseFloat(
        this.rate.toFiat(satoshis, settings.alternativeIsoCode).toFixed(2)
      );
      v1 = this.filter.formatFiatAmount(v1);
      if (!v1) return null;

      return v1 + ' ' + settings.alternativeIsoCode;
    }).bind(this);

    if (!this.rate.isBtcAvailable())
      return null;
    return val();
  }

  public processTx(tx) {
    if (!tx || tx.action == 'invalid') return tx;

    // New transaction output format
    if (tx.outputs && tx.outputs.length) {
      var outputsNr = tx.outputs.length;

      if (tx.action != 'received') {
        if (outputsNr > 1) {
          tx.recipientCount = outputsNr;
          tx.hasMultiplesOutputs = true;
        }
        tx.amount = _.reduce(
          tx.outputs,
          (total, o) => {
            o.amountStr = this.formatAmountStr(o.amount);
            o.alternativeAmountStr = this.formatAlternativeStr(o.amount);
            return total + o.amount;
          },
          0
        );
      }
      tx.toAddress = tx.outputs[0].toAddress;
    }

    tx.amountStr = this.formatAmountStr(tx.amount);
    tx.alternativeAmountStr = this.formatAlternativeStr(tx.amount);
    tx.feeStr = this.formatAmountStr(tx.fee || tx.fees);

    if (tx.amountStr) {
      tx.amountValueStr = tx.amountStr.split(' ')[0];
      tx.amountUnitStr = tx.amountStr.split(' ')[1];
    }

    return tx;
  }

  public formatPendingTxps(txps) {
    this.pendingTxProposalsCountForUs = 0;
    var now = Math.floor(Date.now() / 1000);

    /* To test multiple outputs...
    var txp = {
      message: 'test multi-output',
      fee: 1000,
      createdOn: new Date() / 1000,
      outputs: []
    };
    function addOutput(n) {
      txp.outputs.push({
        amount: 600,
        toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
        message: 'output #' + (Number(n) + 1)
      });
    };
    lodash.times(150, addOutput);
    txps.push(txp);
    */

    _.each(txps, function(tx) {
      // no future transactions...
      if (tx.createdOn > now) tx.createdOn = now;

      // TODO: implement profileService.getWallet(tx.walletId)
      // TODO tx.wallet = profileService.getWallet(tx.walletId);
      tx.wallet = {
        copayerId: 'asdasdasdasd'
      };
      // hardcoded tx.wallet ^

      if (!tx.wallet) {
        this.logger.debug('no wallet at txp?');
        return;
      }

      tx = this.processTx(tx);

      var action = _.find(tx.actions, {
        copayerId: tx.wallet.copayerId
      });

      if (!action && tx.status == 'pending') {
        tx.pendingForUs = true;
      }

      if (action && action.type == 'accept') {
        tx.statusForUs = 'accepted';
      } else if (action && action.type == 'reject') {
        tx.statusForUs = 'rejected';
      } else {
        tx.statusForUs = 'pending';
      }

      if (!tx.deleteLockTime) tx.canBeRemoved = true;
    });

    return txps;
  }

  public parseAmount(
    amount,
    currency: string,
    onlyIntegers?: boolean
  ) {
    let settings = this.configProvider.get().wallet.settings;
    let satToBtc = 1 / 100000000;
    let unitToSatoshi = settings.unitToSatoshi;
    let amountUnitStr;
    let amountSat;
    let alternativeIsoCode = settings.alternativeIsoCode;

    // If fiat currency
    if (currency != 'MANGA') {
      let formattedAmount = onlyIntegers
        ? this.filter.formatFiatAmount(amount.toFixed(0))
        : this.filter.formatFiatAmount(amount);
      amountUnitStr = formattedAmount + ' ' + currency;
      amountSat = Number(this.rate.fromFiat(amount, currency).toFixed(0));
    } else {
      amountSat = parseInt((amount * unitToSatoshi).toFixed(0), 10);
      amountUnitStr = this.formatAmountStr(amountSat);
      // convert unit to MANGA
      amount = (amountSat * satToBtc).toFixed(8);
    }

    return {
      amount,
      currency,
      alternativeIsoCode,
      amountSat,
      amountUnitStr
    };
  }

  public satToUnit(amount): number {
    let settings = this.configProvider.get().wallet.settings;
    let unitToSatoshi = settings.unitToSatoshi;
    let satToUnit = 1 / unitToSatoshi;
    let unitDecimals = settings.unitDecimals;
    return parseFloat((amount * satToUnit).toFixed(unitDecimals));
  }
}

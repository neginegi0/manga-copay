import { Injectable } from '@angular/core';

import { Logger } from '../../providers/logger/logger';

import * as BWC from 'mangacore-wallet-client';

@Injectable()
export class BwcProvider {
  public buildTx = BWC.buildTx;
  public parseSecret = BWC.parseSecret;
  public Client = BWC;
  constructor(private logger: Logger) {
    this.logger.info('BwcProvider initialized.');
  }
  public getMangacore() {
    return BWC.Mangacore;
  }

  public getErrors() {
    return BWC.errors;
  }

  public getSJCL() {
    return BWC.sjcl;
  }

  public getUtils() {
    return BWC.Utils;
  }

  public getClient(walletData?, opts?) {
    opts = opts || {};

    // note opts use `bwsurl` all lowercase;
    let bwc = new BWC({
      baseUrl: opts.bwsurl || 'https://bws.bitpay.com/bws/api',
      verbose: opts.verbose,
      timeout: 100000,
      transports: ['polling']
    });
    if (walletData) bwc.import(walletData, opts);
    return bwc;
  }
}

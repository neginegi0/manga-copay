import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../../providers/logger/logger';

// providers
import { BwcProvider } from '../../providers/bwc/bwc';
import { ConfigProvider } from '../../providers/config/config';

import * as _ from 'lodash';

@Injectable()
export class FeeProvider {
  private CACHE_TIME_TS: number = 60;
  private cache: {
    updateTs: number;
    data?: any;
  } = {
    updateTs: 0
  };

  constructor(
    private configProvider: ConfigProvider,
    private logger: Logger,
    private bwcProvider: BwcProvider,
    private translate: TranslateService
  ) {
    this.logger.info('FeeProvider initialized.');
  }

  public getFeeOpts() {
    const feeOpts = {
      urgent: this.translate.instant('Urgent'),
      priority: this.translate.instant('Priority'),
      normal: this.translate.instant('Normal'),
      economy: this.translate.instant('Economy'),
      superEconomy: this.translate.instant('Super Economy'),
      custom: this.translate.instant('Custom')
    };
    return feeOpts;
  }

  public getCurrentFeeLevel(): string {
    return this.configProvider.get().wallet.settings.feeLevel || 'normal';
  }

  public getFeeRate(
    network: string,
    feeLevel: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (feeLevel == 'custom') return resolve();
      network = network || 'livenet';
      this.getFeeLevels()
        .then(response => {
          let feeLevelRate;

          if (response.fromCache) {
            feeLevelRate = _.find(response.levels[network], o => {
              return o.level == feeLevel;
            });
          } else {
            feeLevelRate = _.find(response.levels[network], o => {
              return o.level == feeLevel;
            });
          }
          if (!feeLevelRate || !feeLevelRate.feePerKb) {
            let msg =
              this.translate.instant('Could not get dynamic fee for level:') +
              ' ' +
              feeLevel;
            return reject(msg);
          }

          let feeRate = feeLevelRate.feePerKb;
          if (!response.fromCache)
            this.logger.debug(
              'Dynamic fee: ' +
                feeLevel +
                '/' +
                network +
                ' ' +
                (feeLevelRate.feePerKb / 1000).toFixed() +
                ' SAT/B'
            );
          return resolve(feeRate);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public getCurrentFeeRate(network: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getFeeRate(network, this.getCurrentFeeLevel())
        .then((data: number) => {
          return resolve(data);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public getFeeLevels(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (
        this.cache.updateTs > Date.now() - this.CACHE_TIME_TS * 1000
      ) {
        return resolve({ levels: this.cache.data, fromCache: true });
      }

      let walletClient = this.bwcProvider.getClient(null, {});

      walletClient.getFeeLevels(
        'livenet',
        (errLivenet, levelsLivenet) => {
          if (errLivenet) {
            return reject(this.translate.instant('Could not get dynamic fee'));
          }
          walletClient.getFeeLevels(
            'testnet',
            (errTestnet, levelsTestnet) => {
              if (errTestnet) {
                return reject(
                  this.translate.instant('Could not get dynamic fee')
                );
              }
              this.cache.updateTs = Date.now();
              this.cache.data = {
                livenet: levelsLivenet,
                testnet: levelsTestnet
              };
              return resolve({ levels: this.cache.data });
            }
          );
        }
      );
    });
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import env from '../../environments';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class RateProvider {
  private rates;
  private alternatives;
  private ratesBCH;
  private ratesBtcAvailable: boolean;
  private ratesBchAvailable: boolean;

  private SAT_TO_MANGA: number;
  private MANGA_TO_SAT: number;

  private rateServiceUrl = env.ratesAPI.btc;
  private bchRateServiceUrl = env.ratesAPI.bch;

  constructor(private http: HttpClient, private logger: Logger) {
    this.logger.info('RateProvider initialized.');
    this.rates = {};
    this.alternatives = [];
    this.ratesBCH = {};
    this.SAT_TO_MANGA = 1 / 1e8;
    this.MANGA_TO_SAT = 1e8;
    this.ratesBtcAvailable = false;
    this.ratesBchAvailable = false;
    this.updateRatesBtc();
    this.updateRatesBch();
  }

  public updateRatesBtc(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getMANGA()
        .then(dataMANGA => {
          _.each(dataMANGA, currency => {
            this.rates[currency.code] = currency.rate;
            this.alternatives.push({
              name: currency.name,
              isoCode: currency.code,
              rate: currency.rate
            });
          });
          this.ratesBtcAvailable = true;
          resolve();
        })
        .catch(errorMANGA => {
          this.logger.error(errorMANGA);
          reject(errorMANGA);
        });
    });
  }

  public updateRatesBch(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getBCH()
        .then(dataBCH => {
          _.each(dataBCH, currency => {
            this.ratesBCH[currency.code] = currency.rate;
          });
          this.ratesBchAvailable = true;
          resolve();
        })
        .catch(errorBCH => {
          this.logger.error(errorBCH);
          reject(errorBCH);
        });
    });
  }

  public getMANGA(): Promise<any> {
    return new Promise(resolve => {
      this.http.get(this.rateServiceUrl).subscribe(data => {
        resolve(data);
      });
    });
  }

  public getBCH(): Promise<any> {
    return new Promise(resolve => {
      this.http.get(this.bchRateServiceUrl).subscribe(data => {
        resolve(data);
      });
    });
  }

  public getRate(code: string): number {
    return this.rates[code];
  }

  public getAlternatives() {
    return this.alternatives;
  }

  public isBtcAvailable() {
    return this.ratesBtcAvailable;
  }

  public isBchAvailable() {
    return this.ratesBchAvailable;
  }

  public toFiat(satoshis: number, code: string): number {
    if (
      !this.isBtcAvailable()
    ) {
      return null;
    }
    return satoshis * this.SAT_TO_MANGA * this.getRate(code);
  }

  public fromFiat(amount: number, code: string): number {
    if (
      !this.isBtcAvailable()
    ) {
      return null;
    }
    return (amount / this.getRate(code)) * this.MANGA_TO_SAT;
  }

  public listAlternatives(sort: boolean) {
    let alternatives = _.map(this.getAlternatives(), (item: any) => {
      return {
        name: item.name,
        isoCode: item.isoCode
      };
    });
    if (sort) {
      alternatives.sort((a, b) => {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      });
    }
    return _.uniqBy(alternatives, 'isoCode');
  }

  public whenRatesAvailable(): Promise<any> {
    return new Promise(resolve => {
      if (
        this.ratesBtcAvailable
      )
        resolve();
      else {
        this.updateRatesBtc().then(() => {
          resolve();
        });
      }
    });
  }
}

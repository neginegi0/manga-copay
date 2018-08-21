import { fakeAsync, tick } from '@angular/core/testing';
import { Events } from 'ionic-angular';
import { AppProvider, PopupProvider } from '..';
import { TestUtils } from '../../test';
import { ActionSheetProvider } from '../action-sheet/action-sheet';
import { BwcProvider } from '../bwc/bwc';
import { Logger } from '../logger/logger';
import { IncomingDataProvider } from './incoming-data';

describe('Provider: Incoming Data Provider', () => {
  let incomingDataProvider: IncomingDataProvider;
  let bwcProvider: BwcProvider;
  let logger: Logger;
  let events: Events;
  let loggerSpy;
  let eventsSpy;
  let actionSheetSpy;

  class AppProviderMock {
    public info = {};
    constructor() {
      this.info = { name: 'bitpay', _enabledExtensions: { debitcard: true } };
    }
  }

  class PopupProviderMock {
    constructor() {}
    ionicConfirm() {
      return Promise.resolve(true);
    }
    ionicAlert() {
      return Promise.resolve();
    }
  }

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule([
      { provide: AppProvider, useClass: AppProviderMock },
      { provide: PopupProvider, useClass: PopupProviderMock }
    ]);
    incomingDataProvider = testBed.get(IncomingDataProvider);
    bwcProvider = testBed.get(BwcProvider);
    logger = testBed.get(Logger);
    events = testBed.get(Events);
    loggerSpy = spyOn(logger, 'debug');
    eventsSpy = spyOn(events, 'publish');
    actionSheetSpy = spyOn(
      testBed.get(ActionSheetProvider),
      'createIncomingDataMenu'
    ).and.returnValue({
      present() {},
      onDidDismiss() {}
    });
  });

  describe('Function: SCANNER Redir', () => {
    it('Should handle plain text', () => {
      let data = [
        'xprv9s21ZrQH143K24Mfq5zL5MhWK9hUhhGbd45hLXo2Pq2oqzMMo63o StZzF93Y5wvzdUayhgkkFoicQZcP3y52uPPxFnfoLZB21Teqt1VvEHx', // BIP 32 mainnet xprivkey
        'cNJFgo1driFnPcBdBX8BrJrpxchBW XwXCvNH5SoSkdcF6JXXwHMm', // WIF Testnet Privkey (compressed pubkey)
        'tprv8ZgxMBicQKsPcsbCVeqqF1KVdH7gwDJbxbzpCxDUsoXHdb6SnTPY xdwSAKDC6KKJzv7khnNWRAJQsRA8BBQyiSfYnRt6zuu4vZQGKjeW4YF', // BIP 32 testnet xprivkey
        'Jason was here'
      ];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith('Incoming-data: Plain text');
        expect(actionSheetSpy).toHaveBeenCalledWith({
          data: {
            type: 'text',
            data: element
          }
        });
      });
    });
    it('Should handle Plain URL', () => {
      let data = [
        'http://bitpay.com/', // non-SSL URL Handling
        'https://bitpay.com/' // SSL URL Handling
      ];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith('Incoming-data: Plain URL');
        expect(actionSheetSpy).toHaveBeenCalledWith({
          data: {
            type: 'url',
            data: element
          }
        });
      });
    });
    it('Should handle Join Wallet', () => {
      let data =
        'copay:RTpopkn5KBnkxuT7x4ummDKx3Lu1LvbntddBC4ssDgaqP7DkojT8ccxaFQEXY4f3huFyMewhHZLbtc';
      let stateParams = { url: data, fromScan: true };
      let nextView = {
        name: 'JoinWalletPage',
        params: stateParams
      };

      expect(incomingDataProvider.redir(data, { activePage: 'ScanPage' })).toBe(
        true
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'Incoming-data (redirect): Code to join to a wallet'
      );
      expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
    });
    it('Should handle Old Join Wallet', () => {
      let data =
        'RTpopkn5KBnkxuT7x4ummDKx3Lu1LvbntddBC4ssDgaqP7DkojT8ccxaFQEXY4f3huFyMewhHZLbtc';
      let stateParams = { url: data, fromScan: true };
      let nextView = {
        name: 'JoinWalletPage',
        params: stateParams
      };

      expect(incomingDataProvider.redir(data, { activePage: 'ScanPage' })).toBe(
        true
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'Incoming-data (redirect): Code to join to a wallet'
      );
      expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
    });
    it('Should handle QR Code Export feature', () => {
      let data = [
        "1|sick arch glare wheat anchor innocent garbage tape raccoon already obey ability|testnet|m/44'/1'/0'|false",
        '2|',
        '3|'
      ];
      data.forEach(element => {
        let stateParams = { code: element, fromScan: true };
        let nextView = {
          name: 'ImportWalletPage',
          params: stateParams
        };
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data (redirect): QR code export feature'
        );
        expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
      });
    });
    it('Should handle MANGA and BCH BitPay Invoices', () => {
      let data = [
        'mangacoin:?r=https://bitpay.com/i/CtcM753gnZ4Wpr5pmXU6i9',
        'mangacoincash:?r=https://bitpay.com/i/Rtz1RwWA7kdRRU3Wyo4YDY'
      ];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data: Payment Protocol with non-backwards-compatible request'
        );
      });
    });
    it('Should handle Mangacoin cash Copay/BitPay format and CashAddr format plain Address', () => {
      let data = [
        'qr00upv8qjgkym8zng3f663n9qte9ljuqqcs8eep5w',
        'CcnxtMfvBHGTwoKGPSuezEuYNpGPJH6tjN'
      ];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data: Mangacoin Cash plain address'
        );
        expect(actionSheetSpy).toHaveBeenCalledWith({
          data: {
            data: element,
            type: 'mangacoinAddress'
          }
        });
      });
    });
    it('Should handle Mangacoin URI', () => {
      let data = [
        'mangacoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Genesis Mangacoin Address
        'mangacoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?message=test%20message', // Mangacoin Address with message and not amount
        'mangacoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=1.0000', // Mangacoin Address with amount
        'mangacoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=1.0000&label=Genesis%20Mangacoin%20Address&message=test%20message' // Basic Payment Protocol
      ];
      data.forEach(element => {
        let parsed = bwcProvider.getMangacore().URI(element);
        let addr = parsed.address ? parsed.address.toString() : '';
        let message = parsed.message;
        let amount = parsed.amount ? parsed.amount : '';
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith('Incoming-data: Mangacoin URI');
        if (amount) {
          let stateParams = {
            amount,
            toAddress: addr,
            description: message
          };
          let nextView = {
            name: 'ConfirmPage',
            params: stateParams
          };
          expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
        } else {
          let stateParams = {
            toAddress: addr,
            description: message
          };
          let nextView = {
            name: 'AmountPage',
            params: stateParams
          };
          expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
        }
      });
    });
    it(
      'Should Handle Mangacoin Cash URI with legacy address',
      fakeAsync(() => {
        let data = 'mangacoincash:1ML5KKKrJEHw3fQqhhajQjHWkh3yKhNZpa';
        expect(
          incomingDataProvider.redir(data, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data: Mangacoin Cash URI with legacy address'
        );

        let parsed = bwcProvider
          .getMangacore()
          .URI(data.replace(/^mangacoincash:/, 'mangacoin:'));

        let oldAddr = parsed.address ? parsed.address.toString() : '';

        let a = bwcProvider
          .getMangacore()
          .Address(oldAddr)
          .toObject();
        let addr = bwcProvider
          .getMangacore()
          .Address.fromObject(a)
          .toString();

        let stateParams = {
          toAddress: addr,
          description: null
        };
        let nextView = {
          name: 'AmountPage',
          params: stateParams
        };
        tick();
        expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
      })
    );
    it('Should handle Mangacoin Livenet and Testnet Plain Address', () => {
      let data = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Genesis Mangacoin Address
        'mpXwg4jMtRhuSpVq4xS3HFHmCmWp9NyGKt' // Genesis Testnet3 Mangacoin Address
      ];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data: Mangacoin plain address'
        );
        expect(actionSheetSpy).toHaveBeenCalledWith({
          data: {
            data: element,
            type: 'mangacoinAddress'
          }
        });
      });
    });
    it('Should handle private keys', () => {
      let data = [
        '6PnSQd4UamkL5LDZrAsmymQrAgj1jywES6frfp5DeFGWni7VouwjxeJ68z', // BIP 38 Encrypt Private Key
        '5Hwgr3u458GLafKBgxtssHSPqJnYoGrSzgQsPwLFhLNYskDPyyA', // WIF Mainnet Privkey (uncompressed pubkey)
        'L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ' // WIF Mainnet Privkey (compressed pubkey)
      ];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith('Incoming-data: private key');
        expect(actionSheetSpy).toHaveBeenCalledWith({
          data: {
            data: element,
            type: 'privateKey'
          }
        });
      });
    });
    it('Should handle Glidera URI', () => {
      let data = ['bitpay://glidera', 'copay://glidera'];
      data.forEach(element => {
        let stateParams = { code: null };
        let nextView = {
          name: 'GlideraPage',
          params: stateParams
        };
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data (redirect): Glidera URL'
        );
        expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
      });
    });
    it('Should handle Coinbase URI', () => {
      let data = ['bitpay://coinbase', 'copay://coinbase'];
      data.forEach(element => {
        let stateParams = { code: null };
        let nextView = {
          name: 'CoinbasePage',
          params: stateParams
        };
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data (redirect): Coinbase URL'
        );
        expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
      });
    });
    it('Should handle BitPay Card URI', () => {
      let data = 'bitpay://bitpay.com?secret=xxxxx&email=xxx@xx.com';
      let stateParams = { secret: 'xxxxx', email: 'xxx@xx.com', otp: null };
      let nextView = {
        name: 'BitPayCardIntroPage',
        params: stateParams
      };
      expect(incomingDataProvider.redir(data, { activePage: 'ScanPage' })).toBe(
        true
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'Incoming-data (redirect): BitPay Card URL'
      );
      expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
    });
  });
});

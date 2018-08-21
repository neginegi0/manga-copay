import { TestUtils } from '../../test';
import { AddressProvider } from './address';

describe('AddressProvider', () => {
  let addressProvider: AddressProvider;

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    addressProvider = testBed.get(AddressProvider);
  });

  let MANGAAddresses = [
    'mscoRRUxbicZdUms3EqDr9jwtCmbbPgfcY', // MANGA Testnet
    '15qT4RJTjs7GSTReEmgXr4LbMjTVQ51LZA' // MANGA Livenet
  ];

  describe('validateAddress', () => {
    it('should validate if address is correct', () => {
      MANGAAddresses.forEach(MANGAAddress => {
        expect(addressProvider.validateAddress(MANGAAddress).isValid).toEqual(
          true
        );
      });
      MANGAAddresses.forEach(MANGAAddress => {
        expect(addressProvider.validateAddress(MANGAAddress).isValid).toEqual(
          true
        );
      });
    });
  });
});

import { Injectable } from '@angular/core';

// Providers
import { BwcProvider } from '../../providers/bwc/bwc';

@Injectable()
export class AddressProvider {
  private mangacore;

  constructor(private bwcProvider: BwcProvider) {
    this.mangacore = this.bwcProvider.getMangacore();
  }

  public validateAddress(address: string) {
    let Address = this.mangacore.Address;
    let isLivenet = Address.isValid(address, 'livenet');
    let isTestnet = Address.isValid(address, 'testnet');
    return {
      address,
      isValid: isLivenet || isTestnet,
      network: isTestnet ? 'testnet' : 'livenet'
    };
  }

  public checkNetwork(
    network: string,
    address: string
  ): boolean {
    let addressData;
    if (this.isValid(address)) {
      let extractedAddress = this.extractAddress(address);
      addressData = this.validateAddress(extractedAddress);
      return addressData.network == network ? true : false;
    } else {
      return false;
    }
  }

  public extractAddress(address: string): string {
    let extractedAddress = address
      .replace(/^(mangacoin:)/, '')
      .replace(/\?.*/, '');
    return extractedAddress || address;
  }

  public isValid(address: string): boolean {
    let URI = this.mangacore.URI;
    let Address = this.mangacore.Address;

    // Bip21 uri
    let uri, isAddressValidLivenet, isAddressValidTestnet;
    if (/^mangacoin:/.test(address)) {
      let isUriValid = URI.isValid(address);
      if (isUriValid) {
        uri = new URI(address);
        isAddressValidLivenet = Address.isValid(
          uri.address.toString(),
          'livenet'
        );
        isAddressValidTestnet = Address.isValid(
          uri.address.toString(),
          'testnet'
        );
      }
      if (isUriValid && (isAddressValidLivenet || isAddressValidTestnet)) {
        return true;
      }
    }

    // Regular Address: try Mangacoin
    let regularAddressLivenet = Address.isValid(address, 'livenet');
    let regularAddressTestnet = Address.isValid(address, 'testnet');
    if (
      regularAddressLivenet ||
      regularAddressTestnet
    ) {
      return true;
    }

    return false;
  }
}

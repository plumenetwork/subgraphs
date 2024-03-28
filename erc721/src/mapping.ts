import { log, BigInt } from '@graphprotocol/graph-ts';
import { Erc721, Transfer as TransferEvent } from '../generated/ERC721/ERC721';
import { Token, Owner, Contract } from '../generated/schema';

export function handleTransfer(event: TransferEvent): void {
    log.debug('Transfer detected. From: {} | To: {} | TokenID: {}', [
        event.params.from.toHexString(),
        event.params.to.toHexString(),
        event.params.tokenId.toHexString(),
    ]);

    let previousOwner = Owner.load(event.params.from.toHexString());
    let newOwner = Owner.load(event.params.to.toHexString());
    let token = Token.load(event.params.tokenId.toHexString());
    let contract = Contract.load(event.address.toHexString());
    let instance = Erc721.bind(event.address);

    if (previousOwner == null) {
        previousOwner = new Owner(event.params.from.toHexString());
    }

    if (newOwner == null) {
        newOwner = new Owner(event.params.to.toHexString());
    }

    if (token == null) {
        token = new Token(event.params.tokenId.toHexString());
        token.contract = event.address.toHexString();

        let uri = instance.try_tokenURI(event.params.tokenId);
        if (!uri.reverted) {
            token.uri = uri.value;
        }
    }

    token.owner = event.params.to.toHexString();

    if (contract == null) {
        contract = new Contract(event.address.toHexString());
    }

    let name = instance.try_name();
    if (!name.reverted) {
        contract.name = name.value;
    }

    let symbol = instance.try_symbol();
    if (!symbol.reverted) {
        contract.symbol = symbol.value;
    }

    let totalSupply = instance.try_totalSupply();
    if (!totalSupply.reverted) {
        contract.totalSupply = totalSupply.value;
    }

    previousOwner.save();
    newOwner.save();
    token.save();
    contract.save();
}
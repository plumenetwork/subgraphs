import { log, BigInt } from '@graphprotocol/graph-ts';
import { Erc721, Transfer as TransferEvent } from '../generated/ERC721/ERC721';
import { Token, Owner, Contract } from '../generated/schema';

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function handleTransfer(event: TransferEvent): void {
    let from = event.params.from.toHexString();
    let to = event.params.to.toHexString();
    let tokenId = event.params.tokenId.toHexString();
    let contractAddress = event.address.toHex();

    log.debug('Transfer detected. From: {} | To: {} | TokenID: {}', [
        from,
        to,
        tokenId,
    ]);

    let newOwner = Owner.load(to);
    let token = Token.load(tokenId);
    let contract = Contract.load(contractAddress);
    let instance = Erc721.bind(event.address);

    if (!newOwner && to != ZERO_ADDRESS) {
        newOwner = new Owner(to);
        newOwner.save();
    }

    if (!contract) {
        contract = new Contract(contractAddress);
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

    contract.save();

    if (!token) {
        token = new Token(tokenId);
        token.contract = contract.id;

        let uri = instance.try_tokenURI(event.params.tokenId);
        if (!uri.reverted) {
            token.uri = uri.value;
        }
    }

    token.owner = newOwner ? newOwner.id : event.params.to.toHexString();
    token.save();

    log.debug('tokenID: {} | owner: {} | contractId: {}', [
        token.id,
        token.owner,
        token.contract,
    ]);
}
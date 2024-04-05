import { store } from '@graphprotocol/graph-ts';
import { Erc721, Transfer as TransferEvent } from '../generated/ERC721/ERC721';
import { Token, Owner, Contract } from '../generated/schema';

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function handleTransfer(event: TransferEvent): void {
    let to = event.params.to.toHexString();
    let tokenId = event.params.tokenId.toHexString();
    let contractAddress = event.address.toHex();

    let newOwner = Owner.load(to);
    let token = Token.load(tokenId);
    let contract = Contract.load(contractAddress);
    let instance = Erc721.bind(event.address);

    if (!contract) {
        contract = new Contract(contractAddress);
    }

    if (to == ZERO_ADDRESS) {
        let id = contract.id + '-' + tokenId ;
        store.remove('Token', id);
        return;
    }

    if (!newOwner) {
        newOwner = new Owner(to);
        newOwner.save();
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

    contract.lastBlockHash = event.block.hash.toHex();

    contract.save();

    if (!token) {
        let id = contract.id + '-' + tokenId ;
        token = new Token(id);
        token.tokenId = tokenId;
        token.contract = contract.id;

        let uri = instance.try_tokenURI(event.params.tokenId);
        if (!uri.reverted) {
            token.uri = uri.value;
        }
    }

    token.owner = to;
    token.save();
}
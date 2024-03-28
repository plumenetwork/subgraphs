// Inspired from https://github.com/berachain/guides/tree/main/apps/goldsky-subgraph

import { Transfer } from "../generated/Erc20/Erc20";
import { fetchTokenDetails, fetchAccount, updateTokenBalance } from "./utils";
import { BigInt } from "@graphprotocol/graph-ts";

export function handleTransfer(event: Transfer): void {
    let token = fetchTokenDetails(event);
    if (!token) {
        return;
    }

    let from = event.params.from.toHex();
    let to = event.params.to.toHex();
    let fromAccount = fetchAccount(from);
    let toAccount = fetchAccount(to);
    if (!fromAccount || !toAccount) {
        return;
    }

    updateTokenBalance(
        token,
        fromAccount,
        BigInt.fromI32(0).minus(event.params.value)
    );

    updateTokenBalance(token, toAccount, event.params.value);
}
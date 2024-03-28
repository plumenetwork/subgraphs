import { Erc20 } from "../generated/Erc20/Erc20";
import { Account, Token, TokenBalance } from "../generated/schema";
import { BigDecimal, ethereum, BigInt } from "@graphprotocol/graph-ts";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function fetchTokenDetails(event: ethereum.Event): Token | null {
    let token = Token.load(event.address.toHex());
    if (!token) {
        token = new Token(event.address.toHex());

        token.name = "N/A";
        token.symbol = "N/A";
        token.decimals = BigDecimal.fromString("0");

        let erc20 = Erc20.bind(event.address);

        let tokenName = erc20.try_name();
        if (!tokenName.reverted) {
            token.name = tokenName.value;
        }

        let tokenSymbol = erc20.try_symbol();
        if (!tokenSymbol.reverted) {
            token.symbol = tokenSymbol.value;
        }

        let tokenDecimal = erc20.try_decimals();
        if (!tokenDecimal.reverted) {
            token.decimals = BigDecimal.fromString(tokenDecimal.value.toString());
        }

        token.save();
    }
    return token;
}

export function fetchAccount(address: string): Account | null {
    let account = Account.load(address);
    if (!account) {
        account = new Account(address);
        account.save();
    }
    return account;
}

export function updateTokenBalance(
    token: Token,
    account: Account,
    amount: BigInt
): void {
    if (ZERO_ADDRESS == account.id) return;

    let accountBalance = getOrCreateAccountBalance(account, token);
    let balance = accountBalance.amount.plus(bigIntToBigDecimal(amount));

    accountBalance.amount = balance;
    accountBalance.save();
}

function getOrCreateAccountBalance(
    account: Account,
    token: Token
): TokenBalance {
    let id = token.id + "-" + account.id;
    let tokenBalance = TokenBalance.load(id);

    if (!tokenBalance) {
        tokenBalance = new TokenBalance(id);
        tokenBalance.account = account.id;
        tokenBalance.token = token.id;
        tokenBalance.amount = BigDecimal.fromString("0");

        tokenBalance.save();
    }

    return tokenBalance;
}

function bigIntToBigDecimal(quantity: BigInt, decimals: i32 = 18): BigDecimal {
    return quantity.divDecimal(
        BigInt.fromI32(10)
            .pow(decimals as u8)
            .toBigDecimal()
    );
}
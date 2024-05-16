import { BigInt } from "@graphprotocol/graph-ts"
import { CheckInEvent } from "../generated/CheckIn/CheckIn"
import { User, CheckIn } from "../generated/schema"

export function handleCheckInEvent(event: CheckInEvent): void {
  let userAddress = event.params.user.toHexString();
  let timestamp = event.block.timestamp;
  
  // Load or create the User entity
  let user = User.load(userAddress);
  if (!user) {
    user = new User(userAddress);
    user.streakCount = BigInt.fromI32(0);
    user.reRolls = BigInt.fromI32(0);
  }

  // Update the user's streak count and reRolls
  user.streakCount = user.streakCount.plus(BigInt.fromI32(1));
  user.reRolls = user.reRolls.plus(BigInt.fromI32(1)); // Adjust this logic based on actual reRoll calculation
  user.save();

  // Create a new CheckIn entity
  let checkIn = new CheckIn(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  checkIn.user = user.id;
  checkIn.timestamp = timestamp;
  checkIn.save();
}

import { IUser } from "@shared.types";
import mongoose, { Schema, Types } from "mongoose";

const userSchema = new Schema({
  name: String,
  phone: String,
});
const User = mongoose.model<IUser>("user", userSchema);

export class UserService {
  async findUser(_id: Types.ObjectId): Promise<IUser> {
    const foundUser = await User.find({ _id }).lean<IUser>();
    return foundUser as IUser;
  }
}

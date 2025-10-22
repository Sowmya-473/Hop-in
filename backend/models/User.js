import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String, // hashed later with bcrypt
  role: { type: String, enum: ["rider", "driver"] }
});

export default mongoose.model("User", userSchema);

import bcrypt from "bcrypt";

// hashear password
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// comparar password 👈 ESTA ES LA QUE FALTA
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
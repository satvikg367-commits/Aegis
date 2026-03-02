export function getUserById(db, userId) {
  return db.users.find((u) => u.id === userId);
}

export function requireUser(db, userId) {
  const user = getUserById(db, userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

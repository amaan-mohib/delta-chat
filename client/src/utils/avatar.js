export const AVATAR_ENDPOINT = (name) =>
  `https://api.dicebear.com/7.x/identicon/svg?seed=${name.split(" ").join("")}`;

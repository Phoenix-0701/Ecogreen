import { fetcher } from "./api";

export const getUserProfile = () => {
  return fetcher("/users/profile"); // Gọi đến endpoint của NestJS
};

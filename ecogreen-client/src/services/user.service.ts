import { fetcher } from "./api";

export const getUserProfile = () => {
  return fetcher("/v1/users");
};

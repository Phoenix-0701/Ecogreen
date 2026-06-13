import { fetcher } from "./api";

export interface UpdateProfilePayload {
  full_name?: string;
  username?: string;
}

export const getMyProfile = () => {
  return fetcher("/v1/users/me");
};

export const updateMyProfile = (payload: UpdateProfilePayload) => {
  return fetcher("/v1/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

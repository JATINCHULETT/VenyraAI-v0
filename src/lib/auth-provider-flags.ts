export type OauthProviderFlags = {
  google: boolean;
  github: boolean;
  microsoftEntra: boolean;
};

export function getOauthProviderFlags(): OauthProviderFlags {
  return {
    google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    github: Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
    microsoftEntra: Boolean(
      process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
    ),
  };
}

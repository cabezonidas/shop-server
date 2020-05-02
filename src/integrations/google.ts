import { google } from "googleapis";

export const getLabels = async () => {
  const auth = authorize();
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.labels.list({ userId: "me" });
  return res.data.labels.map(l => l.name);
};

const authorize = () => {
  const token = {
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    token_type: "Bearer",
  };

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_IT,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials(token);

  return oAuth2Client;
};

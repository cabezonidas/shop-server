import i18next from "i18next";
import * as middleware from "i18next-http-middleware";
import { awsEnUs, awsEsAr } from "../integrations";

const enUs = {
  translation: {
    errors: {
      not_authenticated: "Unauthenticated access",
      invalid_login: "Invalid login",
      invalid_password: "Invalid password",
      aws: awsEnUs,
    },
  },
};

const esAr = {
  translation: {
    errors: {
      not_authenticated: "Acceso sin autenticar",
      invalid_login: "Usuario inválido",
      invalid_password: "Contraseña inválida",
      aws: awsEsAr,
    },
  },
};

i18next.use(middleware.LanguageDetector).init({
  resources: {
    "en-US": enUs,
    "es-AR": esAr,
  },
  lng: "en-US",
  fallbackLng: "en-US",
  detection: {
    lookupHeader: "accept-language",
  },
});

export const translation = middleware.handle(i18next, {
  removeLngFromUrl: false,
});

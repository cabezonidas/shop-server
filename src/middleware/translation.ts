import i18next from "i18next";
import * as middleware from "i18next-http-middleware";
import { awsEnUs, awsEsAr } from "../integrations";
import { postsEnUs, postsEsAr } from "../resolvers/post-resolver";

const enUs = {
  translation: {
    errors: {
      not_authenticated: "Unauthenticated access",
      not_privileges: "Not enough privileges for user",
      invalid_login: "Invalid login",
      invalid_password: "Invalid password",
      aws: awsEnUs,
      posts: postsEnUs,
    },
    roles: {
      admin: "Administrator",
      author: "Author",
    },
  },
};

const esAr = {
  translation: {
    errors: {
      not_authenticated: "Acceso sin autenticar",
      not_privileges: "Usuario con privilegios insuficientes",
      invalid_login: "Usuario inválido",
      invalid_password: "Contraseña inválida",
      aws: awsEsAr,
      posts: postsEsAr,
    },
    roles: {
      admin: "Administrador/a",
      author: "Autor/a",
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

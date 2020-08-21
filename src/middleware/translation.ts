import i18next from "i18next";
import * as middleware from "i18next-http-middleware";
import { awsEnUs, awsEsAr } from "../integrations";
import { postsEnUs, postsEsAr } from "../resolvers/post-resolver";

const enUs = {
  translation: {
    mails: {
      signup: {
        subject: "Latam code {{code}}",
        intro_1: "Welcome to Latam Investing Club",
        intro_2: "We're very excited to have you on board.",
        action_instruction: "To continue, please copy the code {{code}} in the login page",
        invalid_email: "Email provided is invalid",
        greeting: "Hi",
        signature: "Sincerely",
        questions: "Need help, or have questions?",
        questions_action: "Just reply to this email, we'd love to help.",
      },
    },
    errors: {
      user_not_found: "User not found",
      not_authenticated: "Unauthenticated access",
      not_privileges: "Not enough privileges for user",
      invalid_login: "Invalid login",
      invalid_password: "Invalid password",
      invalid_token: "Invalid code",
      account_already_taken: "Account already taken",
      aws: awsEnUs,
      posts: postsEnUs,
    },
    roles: {
      admin: "Administrator",
      author: "Author",
      networker: "Networker",
      "real-state": "Real state",
    },
  },
};

const esAr = {
  translation: {
    mails: {
      signup: {
        subject: "Latam código {{code}}",
        intro_1: "Gracias por acercarte a Latam Investing Club",
        intro_2: "Estamos muy ansiosos de empezar a trabajar juntos.",
        action_instruction:
          "Para continuar, por favor copia el código {{code}} en nuestro formulario de registro",
        invalid_email: "El correo es inválido",
        greeting: "Hola",
        signature: "Atentamente",
        questions: "¿Necesitás ayuda, o tenés alguna consulta?",
        questions_action: "Sólo respondeme a este email. Me encantaría ayudarte.",
      },
    },
    errors: {
      user_not_found: "Userio no encontrado",
      not_authenticated: "Acceso sin autenticar",
      not_privileges: "Usuario con privilegios insuficientes",
      invalid_login: "Usuario inválido",
      invalid_password: "Contraseña inválida",
      invalid_token: "Código inválido",
      account_already_taken: "Cuenta ya existente",
      aws: awsEsAr,
      posts: postsEsAr,
    },
    roles: {
      admin: "Administrador/a",
      author: "Autor/a",
      networker: "Networker",
      "real-state": "Inmobiliaria",
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

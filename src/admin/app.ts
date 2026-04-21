import AuthLogo from './assets/logo.svg';
import MenuLogo from './assets/logo.svg';

export default {
  config: {
    auth: {
      logo: AuthLogo,
    },
    menu: {
      logo: MenuLogo,
    },
    projectName: 'idplay',
    locales: ["en", "id"],
    translations: {
      en: {
        "Auth.form.welcome.title": "Welcome to idplay!",
        "Auth.form.welcome.subtitle": "Log in to your idplay account",
        "app.components.LeftMenu.navbrand.title": "idplay Dashboard",
        "app.components.HomePage.welcome.title": "Welcome to idplay",
        "app.components.HomePage.welcome.subtitle": "Congratulations! You're logged in as the first administrator. To discover the powerful features provided by idplay, we recommend you to create your first Content type!",
      },
      id: {
        "Auth.form.welcome.title": "Selamat datang di idplay!",
        "Auth.form.welcome.subtitle": "Masuk ke akun idplay Anda",
        "app.components.LeftMenu.navbrand.title": "Dashboard idplay",
        "app.components.HomePage.welcome.title": "Selamat datang di idplay",
        "app.components.HomePage.welcome.subtitle": "Selamat! Anda masuk sebagai administrator pertama. Untuk menemukan fitur-fitur hebat yang disediakan oleh idplay, kami sarankan Anda untuk membuat Tipe Konten pertama Anda!",
      },
    },
  },
  bootstrap() {},
};

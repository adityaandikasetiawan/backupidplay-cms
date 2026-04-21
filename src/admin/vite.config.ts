import { mergeConfig, type UserConfig } from 'vite';

export default (config: UserConfig) => {
  return mergeConfig(config, {
    server: {
      allowedHosts: [
        'idplay.co.id',
        'www.idplay.co.id',
        '10.1.1.33',
        '10.80.253.214',
        'localhost',
        '127.0.0.1',
      ],
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  });
};

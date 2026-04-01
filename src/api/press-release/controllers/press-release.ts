// /**
//  * press-release controller
//  */

// import { factories } from '@strapi/strapi'

// export default factories.createCoreController('api::press-release.press-release');

// default value that return type 'news' for press-release entries
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::press-release.press-release', () => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    const newData = data.map((item: any) => ({ ...item, type: 'news' }));
    return { data: newData, meta };
  },

  async findOne(ctx) {
    const response = await super.findOne(ctx);
    if (response?.data) {
      response.data = { ...response.data, type: 'news' };
    }
    return response;
  },
}));
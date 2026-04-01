// /**
//  * article controller
//  */

// import { factories } from '@strapi/strapi'

// export default factories.createCoreController('api::article.article');


// default value that return type 'article' for article entries
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::article.article', () => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    const newData = data.map((item: any) => ({ ...item, type: 'article' }));
    return { data: newData, meta };
  },

  async findOne(ctx) {
    const response = await super.findOne(ctx);
    if (response?.data) {
      response.data = { ...response.data, type: 'article' };
    }
    return response;
  },
}));
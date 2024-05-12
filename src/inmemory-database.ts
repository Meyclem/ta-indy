import { Promocode } from "./promocodes/model.js";

class InMemoryDatabase {
  private data: { promocodes: Promocode[] };

  constructor(initialData: { promocodes: Promocode[] }) {
    this.data = initialData;
  }

  promocodes = {
    get: async ({ name }: { name: string }): Promise<Promocode | undefined> => {
      return this.data.promocodes.find((promocode) => promocode.name === name);
    },

    create: async (promocodeData: Promocode): Promise<void> => {
      this.data.promocodes.push(promocodeData);
    },
  };
}

export default InMemoryDatabase;

import { Promocode } from "./promocodes/model.js";

/**
 * Represents an in-memory database.
 */
class InMemoryDatabase {
  private data: { promocodes: Promocode[] };

  constructor(initialData: { promocodes: Promocode[] }) {
    this.data = initialData;
  }

  promocodes = {
    /**
     * Retrieves a promocode by name.
     * @param name - The name of the promocode.
     * @returns A promise that resolves to the matching promocode, or undefined if not found.
     */
    get: async ({ name }: { name: string }): Promise<Promocode | undefined> => {
      return this.data.promocodes.find((promocode) => promocode.name === name);
    },

    /**
     * Creates a new promocode.
     * @param promocodeData - The data of the promocode to create.
     * @returns A promise that resolves when the promocode is created.
     */
    create: async (promocodeData: Promocode): Promise<void> => {
      this.data.promocodes.push(promocodeData);
    },
  };
}

export default InMemoryDatabase;

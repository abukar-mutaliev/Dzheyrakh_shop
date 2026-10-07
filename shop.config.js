/** @type {import("./lib/shop-config").ShopConfig} */
const shopConfig = {
  shop: {
    name: "Джейрахская полка",
    tagline: "Небольшой магазин: чай, мёд и варенье с понятной доставкой.",
    locale: "ru",
    currency: "RUB",
  },
  brand: {
    logo: "/brand/mark.png",
    colors: {
      primary: "#1f3d32",
      accent: "#c46b3a",
      background: "#f6f3ee",
      foreground: "#1c1917",
    },
  },
  contacts: {
    phone: "+7 928 920-30-06",
    email: "abukar.mutaliev.js@gmail.com",
    telegram: "https://t.me/Mutaliev_A",
    address: "Магас, ул. Примерная, 1",
  },
  categories: [
    { slug: "tea", name: "Чай", description: "Листовой чай" },
    { slug: "honey", name: "Мёд", description: "Мёд с полки" },
    { slug: "jam", name: "Варенье", description: "Домашнее варенье" },
  ],
  delivery: [
    { id: "pickup", name: "Самовывоз", price: 0 },
    { id: "courier", name: "Курьер", price: 35000 },
  ],
};

export default shopConfig;

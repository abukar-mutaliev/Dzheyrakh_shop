export const DESIGN_STORAGE_KEY = "dzheirah-design";

export const designs = [
  {
    id: "shelf",
    name: "Полка",
    note: "Тёплая витрина: зелёный, медь, карточки справа",
    swatches: ["#f6f3ee", "#1f3d32", "#c46b3a", "#1c1917"],
  },
  {
    id: "bazaar",
    name: "Базар",
    note: "Тёплый рынок: терракота, мягкие карточки, витрина по центру",
    swatches: ["#fbf6ef", "#b5461f", "#c9862a", "#2a1812"],
  },
  {
    id: "garden",
    name: "Сад",
    note: "Ночной сад: глубокий фон, золото, галерея по центру",
    swatches: ["#0e1512", "#e7c98a", "#9bb896", "#f4efe4"],
  },
  {
    id: "gazette",
    name: "Газета",
    note: "Журнал: крупный заголовок, рубрика слева, тонкие линии",
    swatches: ["#f7f4ee", "#1a1a1a", "#9a3b4a", "#fffdf8"],
  },
] as const;

export type DesignId = (typeof designs)[number]["id"];

export function isDesignId(value: string | null | undefined): value is DesignId {
  return designs.some((design) => design.id === value);
}

export function designBootScript() {
  const ids = designs.map((design) => design.id);
  return `try{var id=localStorage.getItem(${JSON.stringify(DESIGN_STORAGE_KEY)});if(${JSON.stringify(ids)}.indexOf(id)!==-1)document.documentElement.setAttribute("data-design",id);}catch(e){}`;
}

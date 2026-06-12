const iconPaths = {
  article: [
    "M8 4h7l3 3v13H6V4h2Z",
    "M14 4v4h4M9 13h6M9 17h5"
  ],
  prototype: [
    "m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z",
    "M12 12 4.5 7.8M12 12l7.5-4.2M12 12v8.5"
  ],
  site: [
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
    "M3.6 9h16.8M3.6 15h16.8M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z"
  ],
  book: [
    "M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H7.5A3.5 3.5 0 0 0 4 22V5.5Z",
    "M4 5.5A3.5 3.5 0 0 1 7.5 2H20"
  ]
};

const createSvgIcon = (name) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");

  for (const d of iconPaths[name] || iconPaths.article) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.append(path);
  }

  return svg;
};

const appendText = (parent, tagName, text) => {
  const child = document.createElement(tagName);
  child.textContent = text;
  parent.append(child);
  return child;
};

const createCard = ({ id, title, icon, href, items }) => {
  const card = document.createElement("article");
  card.className = "home-card";
  if (id) card.id = id;

  const cardHead = document.createElement("div");
  cardHead.className = "card-head";

  const cardTitle = document.createElement("div");
  cardTitle.className = "card-title";

  const cardIcon = document.createElement("span");
  cardIcon.className = "card-icon";
  cardIcon.append(createSvgIcon(icon));
  cardTitle.append(cardIcon);
  appendText(cardTitle, "h2", title);

  const viewAll = document.createElement("a");
  viewAll.href = href;
  viewAll.append(document.createTextNode("View all "));
  appendText(viewAll, "span", "→");

  cardHead.append(cardTitle, viewAll);

  const list = document.createElement("ul");
  list.className = "item-list";

  for (const item of items || []) {
    const row = document.createElement("li");
    appendText(row, "span", item.title);
    appendText(row, "time", item.meta);
    list.append(row);
  }

  card.append(cardHead, list);
  return card;
};

const renderHomeCards = async () => {
  const container = document.querySelector("[data-home-cards]");
  if (!container) return;

  try {
    const response = await fetch("/assets/home-cards.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to load home cards: ${response.status}`);
    const cards = await response.json();

    container.replaceChildren(...cards.map(createCard));
  } catch (error) {
    console.error(error);
    container.replaceChildren();
    const message = document.createElement("p");
    message.className = "card-loading";
    message.textContent = "Unable to load collections.";
    container.append(message);
  }
};

renderHomeCards();
